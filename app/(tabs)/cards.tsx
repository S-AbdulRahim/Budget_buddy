import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows, TabularNums, withAlpha } from '../../src/theme';
import {
  loadData,
  addCreditCard,
  updateCreditCard,
  deleteCreditCard,
  confirmCardTransaction,
  dismissCardTransaction,
  addManualCardTransaction,
} from '../../src/data/storage';
import { AppData, CreditCard, CardTransaction, Category } from '../../src/types';
import ConfirmModal from '../../src/components/ConfirmModal';
import SmsConsentModal from '../../src/components/SmsConsentModal';
import AddCreditCardModal from '../../src/components/AddCreditCardModal';
import PendingTransactionsModal from '../../src/components/PendingTransactionsModal';
import AddCardExpenseModal from '../../src/components/AddCardExpenseModal';
import { checkSmsPermissions, requestSmsPermissions, syncHistoricalSms } from '../../src/data/smsService';

export default function CardsScreen() {
  const params = useLocalSearchParams<{ review?: string }>();
  const [data, setData] = useState<AppData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<CreditCard | null>(null);
  const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);
  const [showSmsConsentModal, setShowSmsConsentModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showAddManualExpenseModal, setShowAddManualExpenseModal] = useState(false);
  const [alertModal, setAlertModal] = useState<{ title: string; message: string; onOk?: () => void } | null>(null);

  // SMS Permission & sync states
  const [hasSmsPermission, setHasSmsPermission] = useState(false);
  const [syncingSms, setSyncingSms] = useState(false);

  const fetchData = useCallback(async () => {
    const loaded = await loadData();
    setData(loaded);
    if (Platform.OS === 'android') {
      checkSmsPermissions().then(setHasSmsPermission).catch(() => {});
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  useEffect(() => {
    if (params.review === 'true') {
      setShowPendingModal(true);
    }
  }, [params.review]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleOpenAddCard = () => {
    setCardToEdit(null);
    setShowAddCardModal(true);
  };

  const handleEditCard = (card: CreditCard) => {
    setCardToEdit(card);
    setShowAddCardModal(true);
  };

  const handleSaveCard = async (cardData: Omit<CreditCard, 'id'>) => {
    if (cardToEdit) {
      const updated = await updateCreditCard(cardToEdit.id, cardData);
      setData(updated);
    } else {
      const currentCards = data?.creditCards || [];
      const isFirstCard = currentCards.length === 0;
      const updated = await addCreditCard(cardData);
      setData(updated);

      if (isFirstCard && cardData.smsTrackingEnabled && Platform.OS === 'android') {
        if (hasSmsPermission) {
          setSyncingSms(true);
          const count = await syncHistoricalSms(updated.creditCards);
          setSyncingSms(false);
          const refreshed = await loadData();
          setData(refreshed);
          if (count > 0) {
            setShowPendingModal(true);
          }
        } else {
          setShowSmsConsentModal(true);
        }
      }
    }
  };

  const handleConfirmDeleteCard = async () => {
    if (!cardToDelete) return;
    const updated = await deleteCreditCard(cardToDelete.id);
    setData(updated);
    setCardToDelete(null);
  };

  const handleConsentContinue = async () => {
    setShowSmsConsentModal(false);
    const granted = await requestSmsPermissions();
    setHasSmsPermission(granted);
    if (granted) {
      setSyncingSms(true);
      const count = await syncHistoricalSms();
      setSyncingSms(false);
      const refreshed = await loadData();
      setData(refreshed);
      if (count > 0) {
        setShowPendingModal(true);
      }
    }
  };

  const handleManualSyncSms = async () => {
    if (!hasSmsPermission) {
      setShowSmsConsentModal(true);
      return;
    }
    setSyncingSms(true);
    const count = await syncHistoricalSms();
    setSyncingSms(false);
    const refreshed = await loadData();
    setData(refreshed);
    if (count > 0) {
      setShowPendingModal(true);
    } else {
      setAlertModal({
        title: 'SMS Scan Complete',
        message: 'No new credit card spend alerts were found in your inbox.',
      });
    }
  };

  const handleConfirmPendingTx = async (
    id: string,
    details: { category: string; type?: 'Need' | 'Want'; description?: string }
  ) => {
    const updated = await confirmCardTransaction(id, details);
    setData(updated);
  };

  const handleDismissPendingTx = async (id: string) => {
    const updated = await dismissCardTransaction(id);
    setData(updated);
  };

  const handleSaveManualCardExpense = async (details: {
    cardId: string;
    amount: number;
    merchant: string;
    date: string;
    category: string;
    type: 'Need' | 'Want';
  }) => {
    const updated = await addManualCardTransaction(
      details.cardId,
      details.amount,
      details.merchant,
      details.date,
      details.category,
      details.type
    );
    setData(updated);
  };

  if (!data) {
    return (
      <View style={styles.loading}>
        <Ionicons name="card" size={48} color={Colors.primary} />
        <Text style={styles.loadingText}>Loading cards...</Text>
      </View>
    );
  }

  const creditCards = data.creditCards || [];
  const pendingTransactions = (data.cardTransactions || []).filter(t => t.status === 'pending');
  const categories = data.categories || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Cards</Text>
        <Text style={styles.subtitle}>Credit cards & automated SMS spend tracking</Text>
      </View>

      {/* Pending Transactions Alert Banner */}
      {pendingTransactions.length > 0 && (
        <TouchableOpacity
          style={styles.pendingBanner}
          onPress={() => setShowPendingModal(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Review ${pendingTransactions.length} pending transactions`}
        >
          <View style={styles.pendingBannerLeft}>
            <View style={styles.pendingBannerIcon}>
              <Ionicons name="notifications" size={20} color={Colors.onPrimary} />
            </View>
            <View style={styles.pendingBannerTextWrap}>
              <Text style={styles.pendingBannerTitle}>
                {pendingTransactions.length} Transaction{pendingTransactions.length > 1 ? 's' : ''} Awaiting Review
              </Text>
              <Text style={styles.pendingBannerSub}>
                Detected from your card SMS alerts. Tap to review & assign categories.
              </Text>
            </View>
          </View>
          <View style={styles.pendingBannerAction}>
            <Text style={styles.pendingBannerActionText}>Review</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primaryLight} />
          </View>
        </TouchableOpacity>
      )}

      {/* Cards List Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="card-outline" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Registered Cards</Text>
          <Text style={styles.cardCount}>{creditCards.length}</Text>
        </View>

        {creditCards.length === 0 ? (
          <View style={styles.emptyCardBox}>
            <Ionicons name="card-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyCardTitle}>No Credit Cards Added</Text>
            <Text style={styles.emptyCardSub}>
              Add your credit cards to monitor spending and detect transaction SMS alerts on device.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={handleOpenAddCard}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Add first credit card"
            >
              <Ionicons name="add-circle-outline" size={18} color={Colors.onPrimary} />
              <Text style={styles.emptyAddBtnText}>Add Your First Card</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardsList}>
            {creditCards.map(card => (
              <View key={card.id} style={styles.cardRow}>
                <View style={[styles.cardColorBar, { backgroundColor: card.color || Colors.primary }]} />
                <View style={styles.cardInfo}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardNickname}>{card.nickname}</Text>
                    <Text style={styles.cardLast4}>•••• {card.last4}</Text>
                  </View>
                  <Text style={styles.cardBank}>{card.bank || 'Credit Card'}</Text>
                </View>

                <View style={styles.cardActions}>
                  {Platform.OS === 'android' && (
                    <TouchableOpacity
                      style={[
                        styles.smsToggleChip,
                        card.smsTrackingEnabled && styles.smsToggleChipActive,
                      ]}
                      onPress={async () => {
                        const nextVal = !card.smsTrackingEnabled;
                        if (nextVal && !hasSmsPermission) {
                          setShowSmsConsentModal(true);
                        }
                        const updated = await updateCreditCard(card.id, { smsTrackingEnabled: nextVal });
                        setData(updated);
                      }}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`SMS tracking for ${card.nickname}`}
                    >
                      <Ionicons
                        name={card.smsTrackingEnabled ? 'chatbox-ellipses' : 'chatbox-ellipses-outline'}
                        size={14}
                        color={card.smsTrackingEnabled ? Colors.onPrimary : Colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.smsToggleText,
                          card.smsTrackingEnabled && styles.smsToggleTextActive,
                        ]}
                      >
                        SMS {card.smsTrackingEnabled ? 'On' : 'Off'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.cardIconBtn}
                    onPress={() => handleEditCard(card)}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${card.nickname}`}
                  >
                    <Ionicons name="pencil-outline" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cardIconBtn}
                    onPress={() => setCardToDelete(card)}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${card.nickname}`}
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Action Controls Row */}
        {creditCards.length > 0 && (
          <View style={styles.cardButtonsRow}>
            <TouchableOpacity
              style={styles.addCardButton}
              onPress={handleOpenAddCard}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Add credit card"
            >
              <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.addCardButtonText}>Add Credit Card</Text>
            </TouchableOpacity>

            {Platform.OS === 'android' && (
              <TouchableOpacity
                style={[styles.syncSmsButton, syncingSms && { opacity: 0.6 }]}
                onPress={handleManualSyncSms}
                disabled={syncingSms}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Scan past 90 days SMS"
              >
                <Ionicons name="sync-outline" size={18} color={Colors.textSecondary} />
                <Text style={styles.syncSmsButtonText}>
                  {syncingSms ? 'Scanning...' : 'Scan 90d SMS'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.manualExpenseBtn}
              onPress={() => setShowAddManualExpenseModal(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Log manual card expense"
            >
              <Ionicons name="receipt-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.manualExpenseBtnText}>Log Spend</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Privacy Guarantee Card */}
      <View style={styles.privacyCard}>
        <View style={styles.privacyIconWrap}>
          <Ionicons name="shield-checkmark-outline" size={20} color={Colors.accentGreen} />
        </View>
        <View style={styles.privacyContent}>
          <Text style={styles.privacyTitle}>On-Device Financial Privacy</Text>
          <Text style={styles.privacyText}>
            FinCompass reads SMS only from verified bank sender IDs (HDFC, SBI, ICICI, Axis, Kotak) to parse transaction alerts. All processing occurs locally on your device. No SMS texts or financial records are ever sent to any server.
          </Text>
        </View>
      </View>

      <View style={{ height: Spacing.huge }} />

      {/* Modals */}
      <ConfirmModal
        visible={cardToDelete !== null}
        title="Delete Credit Card"
        message={`Are you sure you want to delete ${cardToDelete?.nickname} (•••• ${cardToDelete?.last4})? Any pending transactions for this card will be dismissed.`}
        confirmText="Delete Card"
        confirmStyle="destructive"
        icon="trash-outline"
        onCancel={() => setCardToDelete(null)}
        onConfirm={handleConfirmDeleteCard}
      />

      <SmsConsentModal
        visible={showSmsConsentModal}
        onContinue={handleConsentContinue}
        onCancel={() => setShowSmsConsentModal(false)}
      />

      <AddCreditCardModal
        visible={showAddCardModal}
        initialCard={cardToEdit}
        onSave={handleSaveCard}
        onClose={() => setShowAddCardModal(false)}
        onRequestSmsConsent={() => setShowSmsConsentModal(true)}
        hasSmsPermission={hasSmsPermission}
      />

      <PendingTransactionsModal
        visible={showPendingModal}
        transactions={pendingTransactions}
        cards={creditCards}
        categories={categories}
        onConfirm={handleConfirmPendingTx}
        onDismiss={handleDismissPendingTx}
        onClose={() => setShowPendingModal(false)}
      />

      <AddCardExpenseModal
        visible={showAddManualExpenseModal}
        cards={creditCards}
        categories={categories}
        onSave={handleSaveManualCardExpense}
        onClose={() => setShowAddManualExpenseModal(false)}
      />

      <ConfirmModal
        visible={alertModal !== null}
        title={alertModal?.title || ''}
        message={alertModal?.message || ''}
        confirmText="OK"
        showCancel={false}
        confirmStyle="primary"
        icon="alert-circle-outline"
        onCancel={() => {
          const cb = alertModal?.onOk;
          setAlertModal(null);
          cb?.();
        }}
        onConfirm={() => {
          const cb = alertModal?.onOk;
          setAlertModal(null);
          cb?.();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.huge + Spacing.md,
    paddingBottom: Spacing.huge,
  },
  loading: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.hero,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: withAlpha(Colors.accentAmber, 0.12),
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: withAlpha(Colors.accentAmber, 0.3),
  },
  pendingBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  pendingBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accentAmber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBannerTextWrap: {
    flex: 1,
  },
  pendingBannerTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  pendingBannerSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pendingBannerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: Spacing.sm,
  },
  pendingBannerActionText: {
    ...Typography.caption,
    fontFamily: Typography.bodyBold.fontFamily,
    color: Colors.primaryLight,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
  },
  cardCount: {
    ...Typography.small,
    color: Colors.textMuted,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginLeft: 'auto',
  },
  emptyCardBox: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
    ...Shadows.elevated,
  },
  emptyCardTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  emptyCardSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primaryButton,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  emptyAddBtnText: {
    ...Typography.bodyBold,
    color: Colors.onPrimary,
  },
  cardsList: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  cardColorBar: {
    width: 6,
    height: 38,
    borderRadius: BorderRadius.sm,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardNickname: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  cardLast4: {
    ...Typography.small,
    ...TabularNums,
    color: Colors.textMuted,
  },
  cardBank: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  smsToggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  smsToggleChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  smsToggleText: {
    ...Typography.badge,
    color: Colors.textMuted,
  },
  smsToggleTextActive: {
    color: Colors.onPrimary,
  },
  cardIconBtn: {
    padding: Spacing.xs,
  },
  cardButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: withAlpha(Colors.primary, 0.4),
  },
  addCardButtonText: {
    ...Typography.caption,
    fontFamily: Typography.bodyBold.fontFamily,
    color: Colors.primaryLight,
  },
  syncSmsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  syncSmsButtonText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  manualExpenseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  manualExpenseBtnText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: withAlpha(Colors.accentGreen, 0.08),
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: withAlpha(Colors.accentGreen, 0.2),
  },
  privacyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: withAlpha(Colors.accentGreen, 0.15),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  privacyContent: {
    flex: 1,
  },
  privacyTitle: {
    ...Typography.bodyBold,
    color: Colors.accentGreen,
    marginBottom: 2,
  },
  privacyText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
