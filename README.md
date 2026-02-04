# BUS-Tickets Mobile App

React Native / Expo mobile application for bus ticket booking.

## Configuration

### API URL Configuration

The app can connect to any compatible Odoo backend. There are several ways to configure the API URL:

#### 1. Runtime Configuration (Recommended for Development)
Users can change the backend URL directly in the app:
- Go to **Settings** > **Backend** > **Change Backend**
- Enter the new API URL
- Tap **Connect**

#### 2. Environment Variables (Build-time)
Set environment variables before building:

```bash
export EXPO_PUBLIC_API_URL="https://your-api-server.com"
export EXPO_PUBLIC_INSTANCE_NAME="Your Company Name"
```

Then build with:
```bash
eas build --platform android --profile preview
```

#### 3. Edit Default Configuration
Edit `src/config/environment.ts` to change the default API URL:

```typescript
export const DEFAULT_API_URL = 'https://your-api-server.com';
export const DEFAULT_INSTANCE_NAME = 'Your Company Name';
```

### Deep Links Configuration

If you want to use deep links for your domain, update these files:

1. **app.json** - Update `ios.associatedDomains` and `android.intentFilters`
2. Configure your server to serve the `.well-known/apple-app-site-association` and `.well-known/assetlinks.json` files

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for Android
npm run build:android:preview

# Build for iOS
npm run build:ios:preview
```

## Building

### Android APK (Preview)
```bash
export EXPO_TOKEN="your-expo-token"
eas build --platform android --profile preview
```

### iOS App (Preview)
```bash
export EXPO_TOKEN="your-expo-token"
eas build --platform ios --profile preview
```

Note: iOS builds require Apple Developer account credentials.

## Project Structure

```
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens
│   ├── auth/              # Authentication screens
│   └── ...
├── src/
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React contexts (Auth, Theme, Config, etc.)
│   ├── config/            # Configuration files
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API client and services
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── assets/                # Images, fonts, etc.
└── app.json               # Expo configuration
```

## Features

- Multi-language support (Ukrainian, Czech, English)
- Dark/Light/System theme
- Offline mode with sync
- QR code tickets
- Multiple payment providers
- Multiple bus operator support
- OAuth authentication (Google, Facebook, Apple)

## License

Copyright (c) 2024-2026 IT Enterprise
