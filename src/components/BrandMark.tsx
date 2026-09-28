import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../theme';

export interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  direction?: 'row' | 'column';
  style?: StyleProp<ViewStyle>;
}

export default function BrandMark({
  size = 'md',
  showWordmark = true,
  direction = 'row',
  style,
}: BrandMarkProps) {
  const config = {
    sm: {
      markSize: 32,
      borderRadius: BorderRadius.md,
      iconSize: 18,
      coinSize: 8,
      coinOffset: 2,
      gap: Spacing.sm,
      textStyle: Typography.subtitle,
    },
    md: {
      markSize: 44,
      borderRadius: BorderRadius.lg,
      iconSize: 24,
      coinSize: 10,
      coinOffset: 3,
      gap: Spacing.md,
      textStyle: Typography.title,
    },
    lg: {
      markSize: 64,
      borderRadius: BorderRadius.xl,
      iconSize: 34,
      coinSize: 14,
      coinOffset: 4,
      gap: Spacing.lg,
      textStyle: Typography.hero,
    },
  }[size];

  return (
    <View
      style={[
        styles.container,
        direction === 'column' ? styles.columnLayout : styles.rowLayout,
        { gap: config.gap },
        style,
      ]}
      accessibilityRole="header"
      accessibilityLabel="Budget Buddy Brand"
    >
      {/* Logomark */}
      <View style={[styles.markWrapper, { width: config.markSize, height: config.markSize }]}>
        <LinearGradient
          colors={[Colors.primaryLight, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradientBox,
            {
              width: config.markSize,
              height: config.markSize,
              borderRadius: config.borderRadius,
            },
          ]}
        >
          <Ionicons
            name="wallet"
            size={config.iconSize}
            color={Colors.onPrimary}
          />
        </LinearGradient>

        {/* Gold coin dot at top right */}
        <View
          style={[
            styles.coinDot,
            {
              width: config.coinSize,
              height: config.coinSize,
              borderRadius: config.coinSize / 2,
              top: config.coinOffset,
              right: config.coinOffset,
            },
          ]}
        />
      </View>

      {/* Wordmark */}
      {showWordmark && (
        <View style={styles.wordmarkRow}>
          <Text style={[config.textStyle, styles.wordBudget]}>Budget </Text>
          <Text style={[config.textStyle, styles.wordBuddy]}>Buddy</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  rowLayout: {
    flexDirection: 'row',
  },
  columnLayout: {
    flexDirection: 'column',
  },
  markWrapper: {
    position: 'relative',
    ...Shadows.subtle,
  },
  gradientBox: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coinDot: {
    position: 'absolute',
    backgroundColor: Colors.accent,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordBudget: {
    color: Colors.textPrimary,
  },
  wordBuddy: {
    color: Colors.primaryLight,
  },
});
