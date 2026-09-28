import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../theme';

interface CalendarPickerModalProps {
  visible: boolean;
  initialValue?: string; // e.g. "15 Jun '26", "Jun '26", "2026-06-15"
  onClose: () => void;
  onSelect: (formattedDate: string, day: number) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function CalendarPickerModal({
  visible,
  initialValue,
  onClose,
  onSelect,
}: CalendarPickerModalProps) {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // June (0-indexed)
  const [selectedDay, setSelectedDay] = useState(15);  // Default 15th
  const [viewMode, setViewMode] = useState<'calendar' | 'months'>('calendar');

  // Parse initial value on open
  useEffect(() => {
    if (visible && initialValue) {
      const clean = initialValue.replace(/['",]/g, ' ').trim();
      const tokens = clean.split(/\s+/);
      const foundIdx = tokens.findIndex(t =>
        MONTH_ABBR.some(m => m.toLowerCase().startsWith(t.toLowerCase().slice(0, 3)))
      );
      if (foundIdx !== -1) {
        const prefix = tokens[foundIdx].toLowerCase().slice(0, 3);
        const idx = MONTH_ABBR.findIndex(m => m.toLowerCase().startsWith(prefix));
        if (idx !== -1) setCurrentMonth(idx);

        // Check for day in other tokens
        const dayToken = tokens.find((t, i) => i !== foundIdx && /^\d{1,2}$/.test(t) && parseInt(t) >= 1 && parseInt(t) <= 31);
        if (dayToken) {
          setSelectedDay(parseInt(dayToken));
        }

        // Check for year in other tokens
        const yToken = tokens.find((t, i) => i !== foundIdx && /^\d{2,4}$/.test(t) && (parseInt(t) > 31 || t.length === 4));
        if (yToken) {
          const parsedY = parseInt(yToken.length === 2 ? '20' + yToken : yToken);
          if (!isNaN(parsedY)) setCurrentYear(parsedY);
        }
      }
    }
  }, [visible, initialValue]);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Days in selected month (handle leap years & clamp day)
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
  const clampedDay = Math.min(selectedDay, daysInMonth);

  const formattedResult = `${clampedDay} ${MONTH_ABBR[currentMonth]} '${currentYear.toString().slice(-2)}`;

  const handleConfirm = () => {
    onSelect(formattedResult, clampedDay);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Select EMI Date</Text>
              <Text style={styles.subtitle}>
                Choose your monthly EMI payment date
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Month & Year Navigation Bar */}
          <View style={styles.navBar}>
            <TouchableOpacity
              onPress={handlePrevMonth}
              style={styles.navArrow}
              accessibilityLabel="Previous month"
            >
              <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.monthYearSelector}
              onPress={() => setViewMode(prev => prev === 'calendar' ? 'months' : 'calendar')}
            >
              <Text style={styles.monthYearText}>
                {MONTH_NAMES[currentMonth]} {currentYear}
              </Text>
              <Ionicons
                name={viewMode === 'calendar' ? 'calendar-outline' : 'grid-outline'}
                size={16}
                color={Colors.primaryLight}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNextMonth}
              style={styles.navArrow}
              accessibilityLabel="Next month"
            >
              <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {viewMode === 'calendar' ? (
            /* Full Monthly Calendar View */
            <View style={styles.calendarContainer}>
              {/* Day Labels */}
              <View style={styles.dayLabelsRow}>
                {DAY_LABELS.map(d => (
                  <Text key={d} style={styles.dayLabelText}>{d}</Text>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.daysGrid}>
                {/* Empty slots before first day */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.dayCell} />
                ))}

                {/* Day numbers */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const isSelected = clampedDay === dayNum;
                  return (
                    <TouchableOpacity
                      key={`day-${dayNum}`}
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                      ]}
                      onPress={() => setSelectedDay(dayNum)}
                    >
                      <Text
                        style={[
                          styles.dayCellText,
                          isSelected && styles.dayCellTextSelected,
                        ]}
                      >
                        {dayNum}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            /* 12-Month Quick Picker View */
            <View style={styles.monthsGrid}>
              {MONTH_ABBR.map((abbr, idx) => {
                const isSelected = currentMonth === idx;
                return (
                  <TouchableOpacity
                    key={abbr}
                    style={[
                      styles.monthCell,
                      isSelected && styles.monthCellSelected,
                    ]}
                    onPress={() => {
                      setCurrentMonth(idx);
                      setViewMode('calendar');
                    }}
                  >
                    <Text
                      style={[
                        styles.monthCellText,
                        isSelected && styles.monthCellTextSelected,
                      ]}
                    >
                      {abbr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Quick Year Stepper */}
          <View style={styles.yearRow}>
            <Text style={styles.yearRowLabel}>Year:</Text>
            <View style={styles.yearButtonGroup}>
              {[-1, 0, 1, 2, 3].map(offset => {
                const y = 2026 + offset;
                const isCurrent = currentYear === y;
                return (
                  <TouchableOpacity
                    key={y}
                    style={[styles.yearChip, isCurrent && styles.yearChipActive]}
                    onPress={() => setCurrentYear(y)}
                  >
                    <Text style={[styles.yearChipText, isCurrent && styles.yearChipTextActive]}>
                      {y}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Selection Banner & Reminder Note */}
          <View style={styles.selectionBanner}>
            <Ionicons name="notifications-outline" size={18} color={Colors.primaryLight} />
            <View style={{ flex: 1 }}>
              <Text style={styles.selectionBannerText}>
                EMI Date: <Text style={{ color: Colors.primaryLight, fontWeight: '700' }}>{formattedResult}</Text>
              </Text>
              <Text style={styles.selectionBannerSubtext}>
                Recurring monthly reminder on the {getOrdinal(clampedDay)}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>Set EMI Date</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: 420,
    width: '100%',
    ...Shadows.elevated,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.bodyBold,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  navArrow: {
    padding: Spacing.xs,
  },
  monthYearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  monthYearText: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  calendarContainer: {
    marginBottom: Spacing.md,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.xs,
  },
  dayLabelText: {
    ...Typography.small,
    color: Colors.textMuted,
    fontWeight: '700',
    width: 36,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    borderRadius: BorderRadius.full,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayCellText: {
    ...Typography.caption,
    color: Colors.textPrimary,
  },
  dayCellTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  monthCell: {
    width: '30%',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  monthCellSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryLight,
  },
  monthCellText: {
    ...Typography.bodyBold,
    color: Colors.textSecondary,
  },
  monthCellTextSelected: {
    color: '#fff',
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  yearRowLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  yearButtonGroup: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  yearChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceHighlight,
  },
  yearChipActive: {
    backgroundColor: Colors.primary,
  },
  yearChipText: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  yearChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  selectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary + '15',
    borderWidth: 1,
    borderColor: Colors.primary + '35',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  selectionBannerText: {
    ...Typography.caption,
    color: Colors.textPrimary,
  },
  selectionBannerSubtext: {
    ...Typography.small,
    color: Colors.primaryLight,
    marginTop: 2,
    opacity: 0.9,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceHighlight,
  },
  cancelBtnText: {
    ...Typography.bodyBold,
    color: Colors.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  confirmBtnText: {
    ...Typography.bodyBold,
    color: '#fff',
  },
});
