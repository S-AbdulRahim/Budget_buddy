import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  TabularNums,
  withAlpha,
} from '../theme';
import { Category, CategoryGroup } from '../types';

export interface CategoryRowProps {
  category: Category;
  budget: string | number;
  onChangeBudget: (text: string) => void;
  onChangeGroup?: (group: CategoryGroup) => void;
  showGroupPicker?: boolean;
  showCheckbox?: boolean;
  isEnabled?: boolean;
  onToggle?: () => void;
  showColorDot?: boolean;
  onDelete?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
  isLast?: boolean;
}

const GROUP_PILLS: { group: CategoryGroup; label: string; color: string }[] = [
  { group: 'Needs', label: 'Need', color: Colors.groupNeeds },
  { group: 'Wants', label: 'Want', color: Colors.groupWants },
  { group: 'Savings', label: 'Savings', color: Colors.groupSavings },
];

export const getCategoryGroupColor = (group?: CategoryGroup): string => {
  if (group === 'Wants') return Colors.groupWants;
  if (group === 'Savings') return Colors.groupSavings;
  return Colors.groupNeeds;
};

export default function CategoryRow({
  category,
  budget,
  onChangeBudget,
  onChangeGroup,
  showGroupPicker = false,
  showCheckbox = false,
  isEnabled = true,
  onToggle,
  showColorDot = false,
  onDelete,
  inputRef,
  isLast = false,
}: CategoryRowProps) {
  const currentGroup = category.group || 'Needs';
  const groupColor = getCategoryGroupColor(currentGroup);

  const handleSelectGroup = (newGroup: CategoryGroup) => {
    if (currentGroup === newGroup) return;
    onChangeGroup?.(newGroup);
  };

  return (
    <View
      style={[
        styles.container,
        isLast && styles.containerLast,
        !isEnabled && styles.containerDisabled,
      ]}
    >
      <View style={styles.leftSection}>
        {showCheckbox && (
          <TouchableOpacity
            onPress={onToggle}
            style={styles.checkboxTouch}
            activeOpacity={0.7}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isEnabled }}
            accessibilityLabel={`${category.name} category toggle`}
          >
            <View
              style={[
                styles.checkbox,
                isEnabled && {
                  backgroundColor: groupColor,
                  borderColor: groupColor,
                },
              ]}
            >
              {isEnabled && (
                <Ionicons
                  name="checkmark"
                  size={14}
                  color={currentGroup === 'Savings' ? Colors.onSuccess : Colors.onPrimary}
                />
              )}
            </View>
          </TouchableOpacity>
        )}

        {showColorDot && (
          <View style={[styles.categoryDot, { backgroundColor: groupColor }]} />
        )}

        <View style={styles.nameAndPills}>
          {showCheckbox ? (
            <TouchableOpacity
              onPress={onToggle}
              activeOpacity={0.7}
              style={styles.nameTouch}
            >
              <Text
                style={[
                  styles.categoryName,
                  !isEnabled && styles.categoryNameDisabled,
                ]}
                numberOfLines={1}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.categoryName} numberOfLines={1}>
              {category.name}
            </Text>
          )}

          {showGroupPicker && isEnabled && (
            <View style={styles.segmentedControl}>
              {GROUP_PILLS.map(pill => {
                const isActive = currentGroup === pill.group;
                return (
                  <TouchableOpacity
                    key={pill.group}
                    style={[
                      styles.pill,
                      isActive
                        ? {
                            backgroundColor: withAlpha(pill.color, 0.2),
                            borderColor: pill.color,
                          }
                        : styles.pillInactive,
                    ]}
                    onPress={() => handleSelectGroup(pill.group)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Set ${category.name} to ${pill.label}`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        isActive
                          ? { color: pill.color, fontFamily: Typography.bodyBold.fontFamily }
                          : { color: Colors.textMuted },
                      ]}
                    >
                      {pill.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>

      <View style={styles.rightSection}>
        {isEnabled ? (
          <View style={styles.inputWrap}>
            <Text style={styles.inputSymbol}>₹</Text>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              keyboardType="numeric"
              value={budget?.toString() ?? ''}
              onChangeText={onChangeBudget}
              cursorColor={Colors.primaryLight}
              selectionColor={Colors.primary}
              accessibilityLabel={`${category.name} budget amount in rupees`}
            />
          </View>
        ) : (
          <Text style={styles.disabledLabel}>Excluded</Text>
        )}

        {onDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${category.name}`}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha(Colors.border, 0.6),
    gap: Spacing.sm,
  },
  containerLast: {
    borderBottomWidth: 0,
  },
  containerDisabled: {
    opacity: 0.45,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  checkboxTouch: {
    padding: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceHighlight,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  nameAndPills: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  nameTouch: {
    justifyContent: 'center',
  },
  categoryName: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  categoryNameDisabled: {
    color: Colors.textSecondary,
  },
  segmentedControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillInactive: {
    backgroundColor: 'transparent',
    borderColor: Colors.border,
  },
  pillText: {
    ...Typography.badge,
    letterSpacing: 0.2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    width: 105,
    height: 38,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputSymbol: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  textInput: {
    ...Typography.body,
    ...TabularNums,
    color: Colors.textPrimary,
    flex: 1,
    paddingVertical: 4,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  disabledLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  deleteButton: {
    padding: Spacing.xs,
    marginLeft: 2,
  },
});
