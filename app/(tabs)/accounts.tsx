import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
  TabularNums,
  withAlpha,
  formatCurrencyFull,
} from '../../src/theme';
import {
  loadData,
  addCreditCard,
  updateCreditCard,
  deleteCreditCard,
  confirmCardTransaction,
  dismissCardTransaction,
  addManualCardTransaction,
  addBankAccount,
  updateBankAccount,
  deleteBankAccount,
  addManualAccountTransaction,
} from '../../src/data/storage';
import { AppData, CreditCard, BankAccount, CardTransaction, AccountTransaction, Category } from '../../src/types';
import ConfirmModal from '../../src/components/ConfirmModal';
import SmsConsentModal from '../../src/components/SmsConsentModal';
import AddCreditCardModal from '../../src/components/AddCreditCardModal';
import AddBankAccountModal from '../../src/components/AddBankAccountModal';
import AddAccountTransactionModal from '../../src/components/AddAccountTransactionModal';
import PendingTransactionsModal from '../../src/components/PendingTransactionsModal';
import AddCardExpenseModal from '../../src/components/AddCardExpenseModal';
import IndeterminateProgressBar from '../../src/components/IndeterminateProgressBar';
import { checkSmsPermissions, requestSmsPermissions, syncHistoricalSms } from '../../src/data/smsService';

type AccountSegment = 'Credit Cards' | 'Debit Cards' | 'Account';

export default function AccountsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ review?: string }>();
  const { width } = useWindowDimensions();
  const [data, setData] = useState<AppData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSegment, setActiveSegment] = useState<AccountSegment>('Credit Cards');

  // Modal states for cards
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<CreditCard | null>(null);
  const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);
  const [showSmsConsentModal, setShowSmsConsentModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showAddManualExpenseModal, setShowAddManualExpenseModal] = useState(false);
  const [alertModal, setAlertModal] = useState<{ title: string; message: string; onOk?: () => void } | null>(null);

  // Modal states for bank accounts
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<BankAccount | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);
  const [showAddAccountTxModal, setShowAddAccountTxModal] = useState(false);

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

  // Card handlers
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

  // Bank Account handlers
  const handleOpenAddAccount = () => {
    setAccountToEdit(null);
    setShowAddAccountModal(true);
  };

  const handleEditAccount = (account: BankAccount) => {
    setAccountToEdit(account);
    setShowAddAccountModal(true);
  };

  const handleSaveAccount = async (accountData: Omit<BankAccount, 'id'>) => {
    if (accountToEdit) {
      const updated = await updateBankAccount(accountToEdit.id, accountData);
      setData(updated);
    } else {
      const updated = await addBankAccount(accountData);
      setData(updated);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (!accountToDelete) return;
    const updated = await deleteBankAccount(accountToDelete.id);
    setData(updated);
    setAccountToDelete(null);
  };

  const handleSaveAccountTransaction = async (txData: {
    accountId: string;
    amount: number;
    description: string;
    date: string;
    type: 'debit' | 'credit';
    category?: string;
    expenseType?: 'Need' | 'Want';
  }) => {
    const updated = await addManualAccountTransaction(
      txData.accountId,
      txData.amount,
      txData.description,
      txData.date,
      txData.type,
      txData.category,
      txData.expenseType
    );
    setData(updated);
  };

  // SMS Consent & manual sync
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
    if (syncingSms) return;
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
        message: 'No new card spend alerts were found in your inbox.',
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
        <Ionicons name="wallet" size={48} color={Colors.primary} />
        <Text style={styles.loadingText}>Loading accounts...</Text>
      </View>
    );
  }

  const allCards = data.creditCards || [];
  const creditCards = allCards.filter(c => (c.cardType || 'credit') === 'credit');
  const debitCards = allCards.filter(c => c.cardType === 'debit');
  const bankAccounts = data.bankAccounts || [];
  const pendingTransactions = (data.cardTransactions || []).filter(t => t.status === 'pending');
  const categories = data.categories || [];

  // Determine active segment items and recent transactions
  const activeCardType: 'credit' | 'debit' = activeSegment === 'Debit Cards' ? 'debit' : 'credit';
  const currentCards = activeSegment === 'Debit Cards' ? debitCards : creditCards;
  const currentCardIds = new Set(currentCards.map(c => c.id));

  const recentConfirmedCardTx = (data.cardTransactions || [])
    .filter(t => t.status === 'confirmed' && currentCardIds.has(t.cardId))
    .slice(0, 5);

  const currentAccountIds = new Set(bankAccounts.map(a => a.id));
  const recentAccountTx = (data.accountTransactions || [])
    .filter(t => currentAccountIds.has(t.accountId))
    .slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Accounts</Text>
        <Text style={styles.subtitle}>Cards, bank accounts & transaction monitoring</Text>

        {/* 3-Way Segmented Control */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeSegment === 'Credit Cards' && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveSegment('Credit Cards')}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel="Credit Cards segment"
            accessibilityState={{ selected: activeSegment === 'Credit Cards' }}
          >
            <Ionicons
              name={activeSegment === 'Credit Cards' ? 'card' : 'card-outline'}
              size={16}
              color={activeSegment === 'Credit Cards' ? Colors.primaryLight : Colors.textMuted}
            />
            <Text
              style={[
                styles.segmentText,
                activeSegment === 'Credit Cards' && styles.segmentTextActive,
              ]}
              numberOfLines={1}
            >
              Credit Cards
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeSegment === 'Debit Cards' && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveSegment('Debit Cards')}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel="Debit Cards segment"
            accessibilityState={{ selected: activeSegment === 'Debit Cards' }}
          >
            <Ionicons
              name={activeSegment === 'Debit Cards' ? 'card' : 'card-outline'}
              size={16}
              color={activeSegment === 'Debit Cards' ? Colors.primaryLight : Colors.textMuted}
            />
            <Text
              style={[
                styles.segmentText,
                activeSegment === 'Debit Cards' && styles.segmentTextActive,
              ]}
              numberOfLines={1}
            >
              Debit Cards
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeSegment === 'Account' && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveSegment('Account')}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel="Bank Account segment"
            accessibilityState={{ selected: activeSegment === 'Account' }}
          >
            <Ionicons
              name={activeSegment === 'Account' ? 'wallet' : 'wallet-outline'}
              size={16}
              color={activeSegment === 'Account' ? Colors.primaryLight : Colors.textMuted}
            />
            <Text
              style={[
                styles.segmentText,
                activeSegment === 'Account' && styles.segmentTextActive,
              ]}
              numberOfLines={1}
            >
              Account
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Indeterminate SMS Scanning Banner (Part 3) */}
      {syncingSms && (
        <View style={styles.syncingBanner}>
          <View style={styles.syncingBannerHeader}>
            <Ionicons name="sync-outline" size={18} color={Colors.primaryLight} />
            <Text style={styles.syncingBannerText}>
              Reading your last 90 days of SMS for transactions…
            </Text>
          </View>
          <IndeterminateProgressBar style={{ marginTop: Spacing.sm }} />
        </View>
      )}

      {/* Pending Transactions Alert Banner (For Card Segments) */}
      {activeSegment !== 'Account' && pendingTransactions.length > 0 && (
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
                Detected from your SMS alerts. Tap to review & assign categories.
              </Text>
            </View>
          </View>
          <View style={styles.pendingBannerAction}>
            <Text style={styles.pendingBannerActionText}>Review</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primaryLight} />
          </View>
        </TouchableOpacity>
      )}

      {/* SEGMENT CONTENT */}
      {activeSegment === 'Account' ? (
        /* BANK ACCOUNTS SEGMENT */
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="wallet-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Bank Accounts</Text>
            <Text style={styles.cardCount}>{bankAccounts.length}</Text>
          </View>

          {/* Account Notice on Manual Tracking */}
          <View style={styles.accountNotice}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.accountNoticeText}>
              Bank account SMS formats differ significantly from card spends. For privacy and precision, accounts support manual entry.
            </Text>
          </View>

          {bankAccounts.length === 0 ? (
            <View style={styles.emptyCardBox}>
              <Ionicons name="business-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyCardTitle}>No Bank Accounts Added</Text>
              <Text style={styles.emptyCardSub}>
                Add your savings or current accounts to track balances, manual debits, and transfers.
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={handleOpenAddAccount}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Add first bank account"
              >
                <Ionicons name="add-circle-outline" size={18} color={Colors.onPrimary} />
                <Text style={styles.emptyAddBtnText}>Add Your First Account</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cardsList}>
              {bankAccounts.map(account => (
                <View key={account.id} style={styles.cardRow}>
                  <View style={[styles.cardColorBar, { backgroundColor: account.color || Colors.primary }]} />
                  <View style={styles.cardInfo}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardNickname}>{account.nickname}</Text>
                      {account.lastDigits ? (
                        <Text style={styles.cardLast4}>•••• {account.lastDigits}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.cardBank}>
                      {(account.bank || 'Bank Account') + ` • ${account.accountType.toUpperCase()}`}
                    </Text>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.cardIconBtn}
                      onPress={() => handleEditAccount(account)}
                      accessibilityRole="button"
                      accessibilityLabel={`Edit ${account.nickname}`}
                    >
                      <Ionicons name="pencil-outline" size={18} color={Colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cardIconBtn}
                      onPress={() => setAccountToDelete(account)}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${account.nickname}`}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons: 2-Row Layout (Part 2, Item 4) */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={handleOpenAddAccount}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Add bank account"
            >
              <Ionicons name="add-circle-outline" size={18} color={Colors.onPrimary} />
              <Text style={styles.primaryActionButtonText}>Add Bank Account</Text>
            </TouchableOpacity>

            {bankAccounts.length > 0 && (
              <View style={styles.secondaryActionsRow}>
                <TouchableOpacity
                  style={[styles.secondaryActionBtn, { flex: 1 }]}
                  onPress={() => setShowAddAccountTxModal(true)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Log account transaction"
                >
                  <Ionicons name="receipt-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.secondaryActionText}>Log Transaction</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Recent Transactions Section for Account (Part 4) */}
          <View style={styles.recentSection}>
            <View style={styles.recentHeaderRow}>
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
              <Text style={styles.recentTitle}>Recent Transactions</Text>
            </View>

            {recentAccountTx.length === 0 ? (
              <View style={styles.emptyRecentBox}>
                <Text style={styles.emptyRecentText}>
                  No transactions recorded yet. Transactions logged here will also appear in Expenses.
                </Text>
              </View>
            ) : (
              <View style={styles.recentList}>
                {recentAccountTx.map(tx => {
                  const acc = bankAccounts.find(a => a.id === tx.accountId);
                  const isDebit = tx.type === 'debit';
                  return (
                    <View key={tx.id} style={styles.recentItem}>
                      <View
                        style={[
                          styles.recentIconWrap,
                          { backgroundColor: withAlpha(isDebit ? Colors.accentRed : Colors.accentGreen, 0.15) },
                        ]}
                      >
                        <Ionicons
                          name={isDebit ? 'arrow-down' : 'arrow-up'}
                          size={18}
                          color={isDebit ? Colors.accentRed : Colors.accentGreen}
                        />
                      </View>
                      <View style={styles.recentContent}>
                        <Text style={styles.recentDescription} numberOfLines={1}>{tx.description}</Text>
                        <View style={styles.recentMeta}>
                          <Text style={styles.recentSubText}>{acc?.nickname || 'Account'}</Text>
                          <View style={styles.recentDot} />
                          <Text style={styles.recentSubText}>{tx.date}</Text>
                        </View>
                      </View>
                      <View style={styles.recentRight}>
                        <Text style={[styles.recentAmount, { color: isDebit ? Colors.accentRed : Colors.accentGreen }]}>
                          {isDebit ? '-' : '+'}₹{tx.amount.toLocaleString('en-IN')}
                        </Text>
                        <View style={styles.recentBadge}>
                          <Text style={styles.recentBadgeText}>
                            {isDebit ? 'Debit' : 'Credit'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <TouchableOpacity
              style={styles.viewAllExpensesBtn}
              onPress={() => router.push('/(tabs)/expenses')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="View all transactions in Expenses"
            >
              <Text style={styles.viewAllExpensesText}>View all in Expenses</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.primaryLight} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* CREDIT / DEBIT CARDS SEGMENT */
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="card-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>
              {activeSegment === 'Debit Cards' ? 'Registered Debit Cards' : 'Registered Credit Cards'}
            </Text>
            <Text style={styles.cardCount}>{currentCards.length}</Text>
          </View>

          {currentCards.length === 0 ? (
            <View style={styles.emptyCardBox}>
              <Ionicons name="card-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyCardTitle}>
                {activeSegment === 'Debit Cards' ? 'No Debit Cards Added' : 'No Credit Cards Added'}
              </Text>
              <Text style={styles.emptyCardSub}>
                Add your {activeSegment.toLowerCase()} to monitor spending and detect transaction SMS alerts on device.
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={handleOpenAddCard}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Add first ${activeSegment.toLowerCase()}`}
              >
                <Ionicons name="add-circle-outline" size={18} color={Colors.onPrimary} />
                <Text style={styles.emptyAddBtnText}>
                  Add Your First {activeSegment === 'Debit Cards' ? 'Debit Card' : 'Credit Card'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cardsList}>
              {currentCards.map(card => (
                <View key={card.id} style={styles.cardRow}>
                  <View style={[styles.cardColorBar, { backgroundColor: card.color || Colors.primary }]} />
                  <View style={styles.cardInfo}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardNickname}>{card.nickname}</Text>
                      <Text style={styles.cardLast4}>•••• {card.last4}</Text>
                    </View>
                    <Text style={styles.cardBank}>{card.bank || (card.cardType === 'debit' ? 'Debit Card' : 'Credit Card')}</Text>
                  </View>

                  <View style={styles.cardActions}>
                    {Platform.OS === 'android' && (
                      <TouchableOpacity
                        style={[
                          styles.smsToggleChip,
                          card.smsTrackingEnabled && styles.smsToggleChipActive,
                          syncingSms && { opacity: 0.5 },
                        ]}
                        disabled={syncingSms}
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

          {/* Action Buttons: 2-Row Layout (Part 2, Item 4) */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={handleOpenAddCard}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Add ${activeSegment === 'Debit Cards' ? 'debit card' : 'credit card'}`}
            >
              <Ionicons name="add-circle-outline" size={18} color={Colors.onPrimary} />
              <Text style={styles.primaryActionButtonText}>
                {activeSegment === 'Debit Cards' ? 'Add Debit Card' : 'Add Credit Card'}
              </Text>
            </TouchableOpacity>

            {currentCards.length > 0 && (
              <View style={styles.secondaryActionsRow}>
                {Platform.OS === 'android' && (
                  <TouchableOpacity
                    style={[styles.secondaryActionBtn, syncingSms && { opacity: 0.5 }]}
                    onPress={handleManualSyncSms}
                    disabled={syncingSms}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Scan past 90 days SMS"
                  >
                    <Ionicons name="sync-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.secondaryActionText}>
                      {syncingSms ? 'Scanning...' : 'Scan 90d SMS'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.secondaryActionBtn}
                  onPress={() => setShowAddManualExpenseModal(true)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Log manual card spend"
                >
                  <Ionicons name="receipt-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.secondaryActionText}>Log Spend</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Recent Transactions Section for Cards (Part 4) */}
          <View style={styles.recentSection}>
            <View style={styles.recentHeaderRow}>
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
              <Text style={styles.recentTitle}>Recent Transactions</Text>
            </View>

            {recentConfirmedCardTx.length === 0 ? (
              <View style={styles.emptyRecentBox}>
                <Text style={styles.emptyRecentText}>
                  No confirmed transactions yet. Spends confirmed from SMS alerts or logged manually will appear here and in your Expenses tab.
                </Text>
              </View>
            ) : (
              <View style={styles.recentList}>
                {recentConfirmedCardTx.map(tx => {
                  const card = allCards.find(c => c.id === tx.cardId);
                  return (
                    <View key={tx.id} style={styles.recentItem}>
                      <View
                        style={[
                          styles.recentIconWrap,
                          { backgroundColor: withAlpha(card?.color || Colors.primary, 0.15) },
                        ]}
                      >
                        <Ionicons
                          name="card-outline"
                          size={18}
                          color={card?.color || Colors.primary}
                        />
                      </View>
                      <View style={styles.recentContent}>
                        <Text style={styles.recentDescription} numberOfLines={1}>
                          {tx.merchant || 'Card Spend'}
                        </Text>
                        <View style={styles.recentMeta}>
                          <Text style={styles.recentSubText}>{card?.nickname || 'Card'}</Text>
                          <View style={styles.recentDot} />
                          <Text style={styles.recentSubText}>{tx.date}</Text>
                        </View>
                      </View>
                      <View style={styles.recentRight}>
                        <Text style={styles.recentAmount}>
                          -₹{tx.amount.toLocaleString('en-IN')}
                        </Text>
                        <View style={styles.recentBadge}>
                          <Text style={styles.recentBadgeText}>
                            {card?.cardType === 'debit' ? 'Debit Card' : 'Credit Card'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <TouchableOpacity
              style={styles.viewAllExpensesBtn}
              onPress={() => router.push('/(tabs)/expenses')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="View all transactions in Expenses"
            >
              <Text style={styles.viewAllExpensesText}>View all in Expenses</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.primaryLight} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* On-Device Financial Privacy Card (Part 2, Item 5: Moved to very bottom) */}
      <View style={styles.privacyCard}>
        <View style={styles.privacyIconWrap}>
          <Ionicons name="shield-checkmark-outline" size={20} color={Colors.accentGreen} />
        </View>
        <View style={styles.privacyContent}>
          <Text style={styles.privacyTitle}>On-Device Financial Privacy</Text>
          <Text style={styles.privacyText}>
            FinCompass reads SMS strictly from verified bank sender IDs (HDFC, SBI, ICICI, Axis, Kotak) to parse transaction alerts. All processing occurs locally on your device. Bank accounts and sensitive credentials are never uploaded to any server.
          </Text>
        </View>
      </View>

      <View style={{ height: Spacing.huge }} />

      {/* Modals */}
      <ConfirmModal
        visible={cardToDelete !== null}
        title="Delete Card"
        message={`Are you sure you want to delete ${cardToDelete?.nickname} (•••• ${cardToDelete?.last4})? Any pending transactions for this card will be dismissed.`}
        confirmText="Delete Card"
        confirmStyle="destructive"
        icon="trash-outline"
        onCancel={() => setCardToDelete(null)}
        onConfirm={handleConfirmDeleteCard}
      />

      <ConfirmModal
        visible={accountToDelete !== null}
        title="Delete Bank Account"
        message={`Are you sure you want to delete ${accountToDelete?.nickname}?`}
        confirmText="Delete Account"
        confirmStyle="destructive"
        icon="trash-outline"
        onCancel={() => setAccountToDelete(null)}
        onConfirm={handleConfirmDeleteAccount}
      />

      <SmsConsentModal
        visible={showSmsConsentModal}
        onContinue={handleConsentContinue}
        onCancel={() => setShowSmsConsentModal(false)}
      />

      <AddCreditCardModal
        visible={showAddCardModal}
        initialCard={cardToEdit}
        defaultCardType={activeCardType}
        onSave={handleSaveCard}
        onClose={() => setShowAddCardModal(false)}
        onRequestSmsConsent={() => setShowSmsConsentModal(true)}
        hasSmsPermission={hasSmsPermission}
      />

      <AddBankAccountModal
        visible={showAddAccountModal}
        initialAccount={accountToEdit}
        onSave={handleSaveAccount}
        onClose={() => setShowAddAccountModal(false)}
      />

      <AddAccountTransactionModal
        visible={showAddAccountTxModal}
        accounts={bankAccounts}
        categories={categories}
        onSave={handleSaveAccountTransaction}
        onClose={() => setShowAddAccountTxModal(false)}
      />

      <PendingTransactionsModal
        visible={showPendingModal}
        transactions={pendingTransactions}
        cards={allCards}
        categories={categories}
        onConfirm={handleConfirmPendingTx}
        onDismiss={handleDismissPendingTx}
        onClose={() => setShowPendingModal(false)}
      />

      <AddCardExpenseModal
        visible={showAddManualExpenseModal}
        cards={currentCards}
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
    marginBottom: Spacing.lg,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.full,
    padding: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  segmentBtnActive: {
    backgroundColor: withAlpha(Colors.primary, 0.2),
    borderWidth: 1,
    borderColor: withAlpha(Colors.primary, 0.5),
  },
  segmentText: {
    ...Typography.small,
    color: Colors.textMuted,
  },
  segmentTextActive: {
    color: Colors.primaryLight,
    fontFamily: Typography.bodyBold.fontFamily,
  },
  syncingBanner: {
    backgroundColor: withAlpha(Colors.primary, 0.12),
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: withAlpha(Colors.primary, 0.3),
    marginBottom: Spacing.lg,
  },
  syncingBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  syncingBannerText: {
    ...Typography.small,
    color: Colors.primaryLight,
    fontFamily: Typography.bodyBold.fontFamily,
    flex: 1,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: withAlpha(Colors.accentAmber, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(Colors.accentAmber, 0.35),
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  pendingBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  pendingBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
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
    gap: 4,
    paddingLeft: Spacing.sm,
  },
  pendingBannerActionText: {
    ...Typography.small,
    fontFamily: Typography.bodyBold.fontFamily,
    color: Colors.primaryLight,
  },
  section: {
    marginBottom: Spacing.xxl,
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
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  accountNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: withAlpha(Colors.surfaceHighlight, 0.6),
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: withAlpha(Colors.border, 0.5),
  },
  accountNoticeText: {
    ...Typography.small,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  emptyCardBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    marginBottom: Spacing.lg,
  },
  emptyCardTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptyCardSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
    maxWidth: 280,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primaryButton,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  emptyAddBtnText: {
    ...Typography.bodyBold,
    color: Colors.onPrimary,
  },
  cardsList: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
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
  actionsContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primaryButton,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    width: '100%',
  },
  primaryActionButtonText: {
    ...Typography.bodyBold,
    color: Colors.onPrimary,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryActionText: {
    ...Typography.caption,
    fontFamily: Typography.bodyBold.fontFamily,
    color: Colors.textSecondary,
  },
  recentSection: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.md,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  recentTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  emptyRecentBox: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  emptyRecentText: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  recentList: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha(Colors.border, 0.4),
    gap: Spacing.md,
  },
  recentIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentContent: {
    flex: 1,
  },
  recentDescription: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  recentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  recentSubText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  recentDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
  },
  recentRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  recentAmount: {
    ...Typography.bodyBold,
    ...TabularNums,
    color: Colors.textPrimary,
  },
  recentBadge: {
    backgroundColor: withAlpha(Colors.primary, 0.12),
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  recentBadgeText: {
    ...Typography.small,
    color: Colors.primaryLight,
  },
  viewAllExpensesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  viewAllExpensesText: {
    ...Typography.small,
    fontFamily: Typography.bodyBold.fontFamily,
    color: Colors.primaryLight,
  },
  privacyCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  privacyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: withAlpha(Colors.accentGreen, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyContent: {
    flex: 1,
  },
  privacyTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  privacyText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
