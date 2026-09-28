import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows, withAlpha } from '../theme';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  cancelText?: string;
  confirmText?: string;
  confirmStyle?: 'destructive' | 'primary';
  icon?: keyof typeof Ionicons.glyphMap;
  showCancel?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  confirmStyle = 'destructive',
  icon = 'warning-outline',
  showCancel = true,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const isDestructive = confirmStyle === 'destructive';
  const confirmColor = isDestructive ? Colors.danger : Colors.primary;

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
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: withAlpha(confirmColor, 0.15) },
                ]}
              >
                <Ionicons name={icon} size={28} color={confirmColor} />
              </View>

              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>

              <View style={styles.actions}>
                {showCancel && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={onCancel}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelText}>{cancelText}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: confirmColor }]}
                  onPress={onConfirm}
                  activeOpacity={0.7}
                >
                  <Text style={styles.confirmText}>{confirmText}</Text>
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
    maxWidth: 380,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.elevated,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.title,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    ...Typography.bodyBold,
    color: Colors.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    ...Typography.bodyBold,
    color: Colors.onPrimary,
  },
});
