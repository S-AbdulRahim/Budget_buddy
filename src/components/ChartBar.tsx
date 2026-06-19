import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../theme';

interface ChartBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  showValue?: boolean;
  height?: number;
}

export default function ChartBar({
  label,
  value,
  maxValue,
  color,
  showValue = true,
  height = 120,
}: ChartBarProps) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const animatedHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: percentage,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const heightInterpolation = animatedHeight.interpolate({
    inputRange: [0, 100],
    outputRange: [0, height],
  });

  return (
    <View style={styles.container}>
      {showValue && (
        <Text style={[styles.value, { color }]}>
          ₹{(value / 1000).toFixed(0)}K
        </Text>
      )}
      <View style={[styles.track, { height }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              height: heightInterpolation,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  value: {
    ...Typography.small,
    fontWeight: '700',
    marginBottom: 4,
  },
  track: {
    width: 24,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fill: {
    width: '100%',
    borderRadius: BorderRadius.sm,
  },
  label: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 4,
    fontSize: 9,
  },
});
