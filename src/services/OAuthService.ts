/**
 * BUS-Tickets - OAuth Service
 * Handles OAuth authentication with Google, Facebook, and Apple
 * Copyright (c) 2024-2026 IT Enterprise
 */

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// Complete auth session for web
WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'facebook' | 'apple';

interface OAuthConfig {
  clientId: string;
  clientSecret?: string;
  scopes: string[];
}

interface OAuthResult {
  success: boolean;
  provider: OAuthProvider;
  idToken?: string;
  accessToken?: string;
  user?: {
    id: string;
    email?: string;
    name?: string;
    picture?: string;
  };
  error?: string;
}

// OAuth endpoints
const OAUTH_ENDPOINTS = {
  google: {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    userInfoEndpoint: 'https://www.googleapis.com/oauth2/v3/userinfo',
  },
  facebook: {
    authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
    userInfoEndpoint: 'https://graph.facebook.com/me',
  },
  apple: {
    authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
    tokenEndpoint: 'https://appleid.apple.com/auth/token',
  },
};

// Default scopes per provider
const DEFAULT_SCOPES: Record<OAuthProvider, string[]> = {
  google: ['openid', 'profile', 'email'],
  facebook: ['email', 'public_profile'],
  apple: ['name', 'email'],
};

class OAuthService {
  private configs: Partial<Record<OAuthProvider, OAuthConfig>> = {};

  /**
   * Configure OAuth provider
   */
  configure(provider: OAuthProvider, config: OAuthConfig) {
    this.configs[provider] = {
      ...config,
      scopes: config.scopes || DEFAULT_SCOPES[provider],
    };
  }

  /**
   * Configure all providers from app config
   */
  configureFromAppConfig(authProviders: Array<{ id: string; clientId?: string; enabled: boolean }>) {
    authProviders.forEach((p) => {
      if (p.enabled && p.clientId && ['google', 'facebook', 'apple'].includes(p.id)) {
        this.configure(p.id as OAuthProvider, {
          clientId: p.clientId,
          scopes: DEFAULT_SCOPES[p.id as OAuthProvider],
        });
      }
    });
  }

  /**
   * Get redirect URI for OAuth
   */
  getRedirectUri(): string {
    return AuthSession.makeRedirectUri({
      scheme: 'bustickets',
      path: 'auth',
    });
  }

  /**
   * Generate random state for CSRF protection
   */
  private async generateState(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    return Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generate code verifier for PKCE
   */
  private async generateCodeVerifier(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    return AuthSession.makeRedirectUri({ native: 'bustickets://auth' })
      .split('')
      .map((c, i) => randomBytes[i % randomBytes.length].toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 43);
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<OAuthResult> {
    const config = this.configs.google;
    if (!config?.clientId) {
      return {
        success: false,
        provider: 'google',
        error: 'Google OAuth not configured. Please set client ID.',
      };
    }

    try {
      const redirectUri = this.getRedirectUri();
      const state = await this.generateState();

      const discovery = {
        authorizationEndpoint: OAUTH_ENDPOINTS.google.authorizationEndpoint,
        tokenEndpoint: OAUTH_ENDPOINTS.google.tokenEndpoint,
        revocationEndpoint: OAUTH_ENDPOINTS.google.revocationEndpoint,
      };

      const request = new AuthSession.AuthRequest({
        clientId: config.clientId,
        scopes: config.scopes,
        redirectUri,
        state,
        responseType: AuthSession.ResponseType.Code,
        usePKCE: true,
        extraParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      });

      const result = await request.promptAsync(discovery);

      if (result.type === 'success' && result.params.code) {
        // Exchange code for tokens
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId: config.clientId,
            code: result.params.code,
            redirectUri,
            extraParams: {
              code_verifier: request.codeVerifier!,
            },
          },
          discovery
        );

        // Fetch user info
        const userInfo = await this.fetchGoogleUserInfo(tokenResult.accessToken);

        return {
          success: true,
          provider: 'google',
          idToken: tokenResult.idToken,
          accessToken: tokenResult.accessToken,
          user: userInfo,
        };
      } else if (result.type === 'cancel') {
        return {
          success: false,
          provider: 'google',
          error: 'User cancelled authentication',
        };
      } else {
        return {
          success: false,
          provider: 'google',
          error: result.type === 'error' ? result.error?.message : 'Authentication failed',
        };
      }
    } catch (error) {
      console.error('Google OAuth error:', error);
      return {
        success: false,
        provider: 'google',
        error: error instanceof Error ? error.message : 'Google authentication failed',
      };
    }
  }

  /**
   * Sign in with Facebook
   */
  async signInWithFacebook(): Promise<OAuthResult> {
    const config = this.configs.facebook;
    if (!config?.clientId) {
      return {
        success: false,
        provider: 'facebook',
        error: 'Facebook OAuth not configured. Please set client ID.',
      };
    }

    try {
      const redirectUri = this.getRedirectUri();
      const state = await this.generateState();

      const discovery = {
        authorizationEndpoint: OAUTH_ENDPOINTS.facebook.authorizationEndpoint,
        tokenEndpoint: OAUTH_ENDPOINTS.facebook.tokenEndpoint,
      };

      const request = new AuthSession.AuthRequest({
        clientId: config.clientId,
        scopes: config.scopes,
        redirectUri,
        state,
        responseType: AuthSession.ResponseType.Token, // Facebook uses implicit flow
      });

      const result = await request.promptAsync(discovery);

      if (result.type === 'success' && result.params.access_token) {
        // Fetch user info
        const userInfo = await this.fetchFacebookUserInfo(result.params.access_token);

        return {
          success: true,
          provider: 'facebook',
          accessToken: result.params.access_token,
          user: userInfo,
        };
      } else if (result.type === 'cancel') {
        return {
          success: false,
          provider: 'facebook',
          error: 'User cancelled authentication',
        };
      } else {
        return {
          success: false,
          provider: 'facebook',
          error: 'Authentication failed',
        };
      }
    } catch (error) {
      console.error('Facebook OAuth error:', error);
      return {
        success: false,
        provider: 'facebook',
        error: error instanceof Error ? error.message : 'Facebook authentication failed',
      };
    }
  }

  /**
   * Sign in with Apple
   */
  async signInWithApple(): Promise<OAuthResult> {
    const config = this.configs.apple;

    // Apple Sign In is only available on iOS and web
    if (Platform.OS === 'android') {
      return {
        success: false,
        provider: 'apple',
        error: 'Apple Sign In is not available on Android',
      };
    }

    if (!config?.clientId) {
      return {
        success: false,
        provider: 'apple',
        error: 'Apple OAuth not configured. Please set client ID.',
      };
    }

    try {
      const redirectUri = this.getRedirectUri();
      const state = await this.generateState();

      const discovery = {
        authorizationEndpoint: OAUTH_ENDPOINTS.apple.authorizationEndpoint,
        tokenEndpoint: OAUTH_ENDPOINTS.apple.tokenEndpoint,
      };

      const request = new AuthSession.AuthRequest({
        clientId: config.clientId,
        scopes: config.scopes,
        redirectUri,
        state,
        responseType: AuthSession.ResponseType.Code,
        usePKCE: true,
        extraParams: {
          response_mode: 'form_post',
        },
      });

      const result = await request.promptAsync(discovery);

      if (result.type === 'success' && result.params.code) {
        // For Apple, the id_token is returned directly
        // The backend should verify this token
        return {
          success: true,
          provider: 'apple',
          idToken: result.params.id_token,
          accessToken: result.params.code,
          user: result.params.user
            ? JSON.parse(result.params.user)
            : undefined,
        };
      } else if (result.type === 'cancel') {
        return {
          success: false,
          provider: 'apple',
          error: 'User cancelled authentication',
        };
      } else {
        return {
          success: false,
          provider: 'apple',
          error: 'Authentication failed',
        };
      }
    } catch (error) {
      console.error('Apple OAuth error:', error);
      return {
        success: false,
        provider: 'apple',
        error: error instanceof Error ? error.message : 'Apple authentication failed',
      };
    }
  }

  /**
   * Sign in with any provider
   */
  async signIn(provider: OAuthProvider): Promise<OAuthResult> {
    switch (provider) {
      case 'google':
        return this.signInWithGoogle();
      case 'facebook':
        return this.signInWithFacebook();
      case 'apple':
        return this.signInWithApple();
      default:
        return {
          success: false,
          provider,
          error: `Unknown provider: ${provider}`,
        };
    }
  }

  /**
   * Fetch Google user info
   */
  private async fetchGoogleUserInfo(
    accessToken: string
  ): Promise<{ id: string; email?: string; name?: string; picture?: string }> {
    const response = await fetch(OAUTH_ENDPOINTS.google.userInfoEndpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Google user info');
    }

    const data = await response.json();
    return {
      id: data.sub,
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  }

  /**
   * Fetch Facebook user info
   */
  private async fetchFacebookUserInfo(
    accessToken: string
  ): Promise<{ id: string; email?: string; name?: string; picture?: string }> {
    const response = await fetch(
      `${OAUTH_ENDPOINTS.facebook.userInfoEndpoint}?fields=id,name,email,picture&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Facebook user info');
    }

    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture?.data?.url,
    };
  }

  /**
   * Check if provider is configured
   */
  isConfigured(provider: OAuthProvider): boolean {
    return !!this.configs[provider]?.clientId;
  }

  /**
   * Get configured providers
   */
  getConfiguredProviders(): OAuthProvider[] {
    return (Object.keys(this.configs) as OAuthProvider[]).filter(
      (p) => this.configs[p]?.clientId
    );
  }
}

export const oAuthService = new OAuthService();
