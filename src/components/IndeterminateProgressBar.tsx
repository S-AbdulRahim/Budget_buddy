import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, AccessibilityInfo, StyleProp, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, withAlpha } from '../theme';

interface IndeterminateProgressBarProps {
  style?: StyleProp<ViewStyle>;
  height?: number;
}

export default function IndeterminateProgressBar({
  style,
  height = 4,
}: IndeterminateProgressBarProps) {
  const animValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0.3)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // Check system reduced motion setting
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      setReduceMotion(enabled);
    }).catch(() => {});

    const listener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled: boolean) => setReduceMotion(enabled)
    );

    return () => {
      listener?.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      // Gentle pulsing opacity when motion is reduced
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 0.9,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 0.3,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    } else {
      // Smooth continuous sweep
      const sweepLoop = Animated.loop(
        Animated.timing(animValue, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        })
      );
      sweepLoop.start();
      return () => sweepLoop.stop();
    }
  }, [reduceMotion, animValue, pulseValue]);

  // Translate across the container width
  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 360],
  });

  return (
    <View style={[styles.track, { height }, style]}>
      {reduceMotion ? (
        <Animated.View
          style={[
            styles.reducedIndicator,
            { height, opacity: pulseValue },
          ]}
        />
      ) : (
        <Animated.View
          style={[
            styles.indicator,
            {
              height,
              transform: [{ translateX }],
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: withAlpha(Colors.primary, 0.2),
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  indicator: {
    width: '45%',
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.full,
  },
  reducedIndicator: {
    width: '100%',
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.full,
  },
});
