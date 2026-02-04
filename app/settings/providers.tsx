/**
 * BUS-Tickets - Providers Management Screen
 * Copyright (c) 2024-2026 IT Enterprise
 */

import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocale } from '@/contexts/LocaleContext';
import { useProviders, BusProvider } from '@/contexts/ProvidersContext';

export default function ProvidersScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLocale();
  const {
    providers,
    addProvider,
    updateProvider,
    removeProvider,
    toggleProvider,
    setDefaultProvider,
    testConnection,
    syncAllProviders,
  } = useProviders();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<BusProvider | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  // New provider form state
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    apiUrl: '',
    apiKey: '',
    logoUrl: '',
    primaryColor: '#e94560',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      apiUrl: '',
      apiKey: '',
      logoUrl: '',
      primaryColor: '#e94560',
    });
    setEditingProvider(null);
  };

  const handleAddProvider = async () => {
    if (!formData.name || !formData.apiUrl) {
      Alert.alert(t.common.error, 'Name and API URL are required');
      return;
    }

    try {
      if (editingProvider) {
        await updateProvider(editingProvider.id, {
          name: formData.name,
          displayName: formData.displayName || formData.name,
          apiUrl: formData.apiUrl,
          apiKey: formData.apiKey || undefined,
          logoUrl: formData.logoUrl || undefined,
          primaryColor: formData.primaryColor,
        });
      } else {
        await addProvider({
          name: formData.name,
          displayName: formData.displayName || formData.name,
          apiUrl: formData.apiUrl,
          apiKey: formData.apiKey || undefined,
          logoUrl: formData.logoUrl || undefined,
          primaryColor: formData.primaryColor,
          enabled: true,
          isDefault: providers.length === 0,
          supportsOnlinePayment: true,
          supportsSeatSelection: true,
          supportsRefunds: false,
        });
      }
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      Alert.alert(t.common.error, 'Failed to save provider');
    }
  };

  const handleEditProvider = (provider: BusProvider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      displayName: provider.displayName,
      apiUrl: provider.apiUrl,
      apiKey: provider.apiKey || '',
      logoUrl: provider.logoUrl || '',
      primaryColor: provider.primaryColor || '#e94560',
    });
    setShowAddModal(true);
  };

  const handleDeleteProvider = (provider: BusProvider) => {
    if (provider.isDefault) {
      Alert.alert(t.common.error, 'Cannot delete default provider');
      return;
    }

    Alert.alert(
      t.common.delete,
      `Are you sure you want to remove ${provider.displayName}?`,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: () => removeProvider(provider.id),
        },
      ]
    );
  };

  const handleTestConnection = async (provider: BusProvider) => {
    setTestingId(provider.id);
    try {
      const success = await testConnection(provider);
      if (success) {
        Alert.alert(t.common.success, 'Connection successful!');
      } else {
        Alert.alert(t.common.error, `Connection failed: ${provider.errorMessage || 'Unknown error'}`);
      }
    } catch (error) {
      Alert.alert(t.common.error, 'Connection test failed');
    } finally {
      setTestingId(null);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      await syncAllProviders();
      Alert.alert(t.common.success, 'All providers synced');
    } catch (error) {
      Alert.alert(t.common.error, 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const styles = createStyles(colors);

  const ProviderCard = ({ provider }: { provider: BusProvider }) => (
    <View style={styles.providerCard}>
      <View style={styles.providerHeader}>
        {provider.logoUrl ? (
          <Image
            source={{ uri: provider.logoUrl }}
            style={styles.providerLogo}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.providerLogoPlaceholder, { backgroundColor: provider.primaryColor }]}>
            <Text style={styles.providerLogoText}>
              {provider.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.providerInfo}>
          <View style={styles.providerNameRow}>
            <Text style={styles.providerName}>{provider.displayName}</Text>
            {provider.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Default</Text>
              </View>
            )}
          </View>
          <Text style={styles.providerUrl} numberOfLines={1}>
            {provider.apiUrl}
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: provider.isConnected ? colors.success : colors.error },
              ]}
            />
            <Text style={styles.statusText}>
              {provider.isConnected ? 'Connected' : provider.errorMessage || 'Not connected'}
            </Text>
          </View>
        </View>

        <Switch
          value={provider.enabled}
          onValueChange={(value) => toggleProvider(provider.id, value)}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
        />
      </View>

      <View style={styles.providerActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleTestConnection(provider)}
          disabled={testingId === provider.id}
        >
          {testingId === provider.id ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={18} color={colors.primary} />
              <Text style={styles.actionBtnText}>Test</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleEditProvider(provider)}
        >
          <Ionicons name="pencil-outline" size={18} color={colors.primary} />
          <Text style={styles.actionBtnText}>{t.common.edit}</Text>
        </TouchableOpacity>

        {!provider.isDefault && (
          <>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setDefaultProvider(provider.id)}
            >
              <Ionicons name="star-outline" size={18} color={colors.primary} />
              <Text style={styles.actionBtnText}>Set Default</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnDanger]}
              onPress={() => handleDeleteProvider(provider)}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={[styles.actionBtnText, { color: colors.error }]}>
                {t.common.delete}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Actions */}
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.syncButton}
          onPress={handleSyncAll}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="sync-outline" size={20} color="#fff" />
              <Text style={styles.syncButtonText}>Sync All</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setShowAddModal(true);
          }}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Provider</Text>
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.infoText}>
          Connect multiple bus operators to search and book across different companies.
          Each provider needs an API URL to their Odoo backend.
        </Text>
      </View>

      {/* Providers List */}
      <Text style={styles.sectionTitle}>
        Connected Providers ({providers.length})
      </Text>

      {providers.map((provider) => (
        <ProviderCard key={provider.id} provider={provider} />
      ))}

      {providers.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="bus-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyStateText}>No providers configured</Text>
          <Text style={styles.emptyStateSubtext}>
            Add your first bus operator to start searching for trips
          </Text>
        </View>
      )}

      {/* Add/Edit Provider Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProvider ? 'Edit Provider' : 'Add New Provider'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Provider ID *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., popov_bus"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Display Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Popov Bus"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.displayName}
                  onChangeText={(text) => setFormData({ ...formData, displayName: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>API URL *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://api.popovbus.com"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.apiUrl}
                  onChangeText={(text) => setFormData({ ...formData, apiUrl: text })}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>API Key (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="sk_live_xxx..."
                  placeholderTextColor={colors.textSecondary}
                  value={formData.apiKey}
                  onChangeText={(text) => setFormData({ ...formData, apiKey: text })}
                  autoCapitalize="none"
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Logo URL (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://example.com/logo.png"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.logoUrl}
                  onChangeText={(text) => setFormData({ ...formData, logoUrl: text })}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Brand Color</Text>
                <View style={styles.colorPicker}>
                  {['#e94560', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#34495e'].map(
                    (color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          formData.primaryColor === color && styles.colorOptionSelected,
                        ]}
                        onPress={() => setFormData({ ...formData, primaryColor: color })}
                      >
                        {formData.primaryColor === color && (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>{t.common.cancel}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={handleAddProvider}>
                <Text style={styles.saveButtonText}>{t.common.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    syncButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.secondary,
      borderRadius: 12,
      padding: 14,
    },
    syncButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    addButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 14,
    },
    addButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: colors.primary + '15',
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    infoText: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    providerCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    providerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    providerLogo: {
      width: 48,
      height: 48,
      borderRadius: 8,
    },
    providerLogoPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    providerLogoText: {
      color: '#fff',
      fontSize: 20,
      fontWeight: 'bold',
    },
    providerInfo: {
      flex: 1,
    },
    providerNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    providerName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    defaultBadge: {
      backgroundColor: colors.primary,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    defaultBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '600',
    },
    providerUrl: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    providerActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: colors.background,
    },
    actionBtnDanger: {
      backgroundColor: colors.error + '15',
    },
    actionBtnText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
    },
    emptyState: {
      alignItems: 'center',
      padding: 48,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    modalBody: {
      padding: 16,
      maxHeight: 400,
    },
    modalFooter: {
      flexDirection: 'row',
      gap: 12,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    formGroup: {
      marginBottom: 16,
    },
    formLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
    },
    colorPicker: {
      flexDirection: 'row',
      gap: 12,
    },
    colorOption: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorOptionSelected: {
      borderWidth: 3,
      borderColor: '#fff',
    },
    cancelButton: {
      flex: 1,
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.background,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    saveButton: {
      flex: 1,
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
  });
