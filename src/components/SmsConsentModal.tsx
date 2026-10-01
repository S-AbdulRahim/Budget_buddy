import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows, withAlpha } from '../theme';

interface SmsConsentModalProps {
  visible: boolean;
  onContinue: () => void;
  onCancel: () => void;
}

export default function SmsConsentModal({
  visible,
  onContinue,
  onCancel,
}: SmsConsentModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <View style={styles.header}>
                <View style={styles.iconWrap}>
                  <Ionicons name="shield-checkmark-outline" size={28} color={Colors.primary} />
                </View>
                <Text style={styles.title}>SMS Expense Tracking</Text>
                <Text style={styles.subtitle}>
                  FinCompass can automatically detect and log card spends from your bank alerts.
                </Text>
              </View>

              <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="card-outline" size={20} color={Colors.accent} />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>Bank Alerts Only</Text>
                    <Text style={styles.featureText}>
                      We only read transaction alerts from verified Indian bank sender IDs (HDFC, SBI, ICICI, Axis, Kotak, etc.). Personal messages, OTPs, and promotional texts are strictly ignored.
                    </Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={Colors.accentGreen} />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>100% On-Device Privacy</Text>
                    <Text style={styles.featureText}>
                      All parsing occurs locally on your phone. No SMS text, banking credentials, or financial numbers are ever uploaded to any server.
                    </Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="time-outline" size={20} color={Colors.primaryLight} />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>Past 90 Days Catch-Up</Text>
                    <Text style={styles.featureText}>
                      We look back up to 90 days to help you effortlessly review and import recent credit card purchases.
                    </Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={Colors.categoryRent} />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>You're In Control</Text>
                    <Text style={styles.featureText}>
                      Detected spends arrive as pending reviews. Nothing is added to your budget without your explicit confirmation.
                    </Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onCancel}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel SMS permission"
                >
                  <Text style={styles.cancelText}>Not Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.continueBtn}
                  onPress={onContinue}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Continue to enable SMS tracking"
                >
                  <Text style={styles.continueText}>Enable Tracking</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.elevated,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: withAlpha(Colors.primary, 0.15),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  scrollArea: {
    marginVertical: Spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  featureText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    ...Typography.bodyBold,
    color: Colors.textSecondary,
  },
  continueBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    ...Typography.bodyBold,
    color: Colors.onPrimary,
  },
});
