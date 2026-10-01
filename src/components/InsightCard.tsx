import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, withAlpha } from '../theme';

export interface InsightCardProps {
  icon?: keyof typeof Ionicons.glyphMap;
  text: string;
  subtext?: string;
  style?: StyleProp<ViewStyle>;
}

export default function InsightCard({
  icon = 'bulb-outline',
  text,
  subtext,
  style,
}: InsightCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={20} color={Colors.accent} />
      </View>
      <View style={styles.content}>
        <Text style={styles.mainText}>{text}</Text>
        {subtext ? <Text style={styles.subtext}>{subtext}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: withAlpha(Colors.accent, 0.08),
    borderWidth: 1,
    borderColor: withAlpha(Colors.accent, 0.25),
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: withAlpha(Colors.accent, 0.15),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  mainText: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  subtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 16,
  },
});
