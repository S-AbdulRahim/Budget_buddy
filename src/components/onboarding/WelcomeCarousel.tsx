import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
  withAlpha,
} from '../../theme';
import BrandMark from '../BrandMark';

export interface WelcomeCarouselProps {
  onStartSetup: () => void;
  contentWidth: number;
}

export const WELCOME_SLIDES = [
  {
    id: '1',
    icon: 'wallet-outline' as const,
    title: 'Know where every rupee goes',
    description: 'Track spending by category and see your month at a glance, with no spreadsheets.',
  },
  {
    id: '2',
    icon: 'trending-down-outline' as const,
    title: 'Pay off debt on your schedule',
    description: 'Plan EMIs, get reminders and watch your balance shrink month by month.',
  },
  {
    id: '3',
    icon: 'rocket-outline' as const,
    title: 'Grow toward your goals',
    description: 'Set savings and investment targets and unlock them as your debt clears.',
  },
];

export default function WelcomeCarousel({ onStartSetup, contentWidth }: WelcomeCarouselProps) {
  const [welcomeIndex, setWelcomeIndex] = useState(0);
  const welcomeScrollRef = useRef<ScrollView>(null);

  // Clamped card width: guarantees only 1 card visible on web and native
  const cardWidth = Math.max(280, Math.min(contentWidth - Spacing.xl * 2, 420));

  const handleScrollToSlide = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(WELCOME_SLIDES.length - 1, index));
    welcomeScrollRef.current?.scrollTo({ x: clampedIndex * cardWidth, animated: true });
    setWelcomeIndex(clampedIndex);
  };

  // Keyboard navigation on desktop web (ArrowLeft / ArrowRight)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setWelcomeIndex(prev => {
          const next = Math.min(WELCOME_SLIDES.length - 1, prev + 1);
          welcomeScrollRef.current?.scrollTo({ x: next * cardWidth, animated: true });
          return next;
        });
      } else if (e.key === 'ArrowLeft') {
        setWelcomeIndex(prev => {
          const prevIdx = Math.max(0, prev - 1);
          welcomeScrollRef.current?.scrollTo({ x: prevIdx * cardWidth, animated: true });
          return prevIdx;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cardWidth]);

  return (
    <ScrollView
      contentContainerStyle={styles.welcomeScrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with BrandMark and Skip */}
      <View style={[styles.welcomeHeader, { maxWidth: cardWidth }]}>
        <BrandMark size="md" />
        <TouchableOpacity
          style={styles.skipButton}
          onPress={onStartSetup}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Skip intro and start setup"
        >
          <Text style={styles.skipButtonText}>Skip</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Swipeable Cards Carousel — fixed width and hidden overflow */}
      <View style={[styles.carouselWrapper, { width: cardWidth }]}>
        <ScrollView
          ref={welcomeScrollRef}
          horizontal
          pagingEnabled
          snapToInterval={cardWidth}
          snapToAlignment="center"
          decelerationRate="fast"
          disableIntervalMomentum
          showsHorizontalScrollIndicator={false}
          style={[styles.carouselScrollView, { width: cardWidth }]}
          contentContainerStyle={styles.carouselScrollContent}
          onMomentumScrollEnd={e => {
            const offsetX = e.nativeEvent.contentOffset.x;
            const idx = Math.round(offsetX / cardWidth);
            setWelcomeIndex(Math.max(0, Math.min(WELCOME_SLIDES.length - 1, idx)));
          }}
          scrollEventThrottle={16}
        >
          {WELCOME_SLIDES.map(slide => (
            <View key={slide.id} style={[styles.welcomeCard, { width: cardWidth }]}>
              <View style={styles.heroIconCircle}>
                <Ionicons name={slide.icon} size={48} color={Colors.primary} />
              </View>
              <Text style={styles.welcomeCardTitle}>{slide.title}</Text>
              <Text style={styles.welcomeCardDescription}>{slide.description}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Dynamic Page Dots based on WELCOME_SLIDES.length */}
        <View style={styles.pageDots}>
          {WELCOME_SLIDES.map((_, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleScrollToSlide(idx)}
              style={[
                styles.pageDot,
                idx === welcomeIndex ? styles.pageDotActive : null,
              ]}
              accessibilityLabel={`Go to slide ${idx + 1} of ${WELCOME_SLIDES.length}`}
            />
          ))}
        </View>

        {/* Carousel Action Button */}
        {welcomeIndex < WELCOME_SLIDES.length - 1 ? (
          <TouchableOpacity
            style={styles.carouselNextBtn}
            onPress={() => handleScrollToSlide(welcomeIndex + 1)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Next slide"
          >
            <Text style={styles.carouselNextBtnText}>Next</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.onPrimary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.carouselGetStartedBtn}
            onPress={onStartSetup}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Get Started with budget setup"
          >
            <Text style={styles.carouselGetStartedBtnText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.onPrimary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Trust and duration footer */}
      <View style={[styles.welcomeFooter, { maxWidth: cardWidth }]}>
        <View style={styles.trustLine}>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color={Colors.primaryLight}
          />
          <Text style={styles.trustLineText}>
            Your data stays on your device. No account needed.
          </Text>
        </View>
        <Text style={styles.durationHint}>Takes about 2 minutes</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  welcomeScrollContent: {
    padding: Spacing.xl,
    paddingTop: Spacing.huge,
    paddingBottom: Spacing.xxxl,
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  welcomeHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skipButtonText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  carouselWrapper: {
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: Spacing.xxl,
  },
  carouselScrollView: {
    flexGrow: 0,
  },
  carouselScrollContent: {
    alignItems: 'center',
  },
  welcomeCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.elevated,
  },
  heroIconCircle: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: withAlpha(Colors.primary, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(Colors.primary, 0.28),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  welcomeCardTitle: {
    ...Typography.title,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  welcomeCardDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 360,
  },
  pageDots: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  pageDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceHighlight,
  },
  pageDotActive: {
    width: 24,
    backgroundColor: Colors.primaryLight,
  },
  carouselNextBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.subtle,
  },
  carouselNextBtnText: {
    ...Typography.bodyBold,
    color: Colors.onPrimary,
  },
  carouselGetStartedBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accentGreen,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.elevated,
  },
  carouselGetStartedBtnText: {
    ...Typography.bodyBold,
    color: Colors.onPrimary,
  },
  welcomeFooter: {
    alignItems: 'center',
    gap: Spacing.sm,
    width: '100%',
  },
  trustLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  trustLineText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  durationHint: {
    ...Typography.small,
    color: Colors.textMuted,
  },
});
