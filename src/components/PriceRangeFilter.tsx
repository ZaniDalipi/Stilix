import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';

interface PriceRangeFilterProps {
  minPrice: number;
  maxPrice: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  currency?: string;
}

export const PriceRangeFilter: React.FC<PriceRangeFilterProps> = ({
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
  currency = 'MKD',
}) => {
  const [localMin, setLocalMin] = useState(minPrice.toString());
  const [localMax, setLocalMax] = useState(maxPrice.toString());

  const handleMinBlur = () => {
    const value = parseInt(localMin, 10) || 0;
    onMinChange(value);
  };

  const handleMaxBlur = () => {
    const value = parseInt(localMax, 10) || 0;
    onMaxChange(value);
  };

  const presetRanges = [
    { label: 'All', min: 0, max: 0 },
    { label: 'Under 1000', min: 0, max: 1000 },
    { label: '1K - 3K', min: 1000, max: 3000 },
    { label: '3K - 5K', min: 3000, max: 5000 },
    { label: '5K - 10K', min: 5000, max: 10000 },
    { label: '10K+', min: 10000, max: 0 },
  ];

  const handlePresetPress = (min: number, max: number) => {
    setLocalMin(min.toString());
    setLocalMax(max.toString());
    onMinChange(min);
    onMaxChange(max);
  };

  const isPresetActive = (min: number, max: number) => {
    return minPrice === min && maxPrice === max;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="cash-outline" size={18} color={colors.textSecondary} />
        <Text style={styles.title}>Price Range ({currency})</Text>
      </View>

      {/* Preset ranges */}
      <View style={styles.presetsContainer}>
        {presetRanges.map((preset, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.presetButton,
              isPresetActive(preset.min, preset.max) && styles.presetButtonActive,
            ]}
            onPress={() => handlePresetPress(preset.min, preset.max)}
          >
            <Text
              style={[
                styles.presetText,
                isPresetActive(preset.min, preset.max) && styles.presetTextActive,
              ]}
            >
              {preset.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom range inputs */}
      <View style={styles.inputsContainer}>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Min</Text>
          <TextInput
            style={styles.input}
            value={localMin}
            onChangeText={setLocalMin}
            onBlur={handleMinBlur}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.gray400}
          />
        </View>
        <View style={styles.separator}>
          <Text style={styles.separatorText}>-</Text>
        </View>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Max</Text>
          <TextInput
            style={styles.input}
            value={localMax}
            onChangeText={setLocalMax}
            onBlur={handleMaxBlur}
            keyboardType="numeric"
            placeholder="No limit"
            placeholderTextColor={colors.gray400}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  presetButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  presetButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  presetTextActive: {
    color: colors.white,
  },
  inputsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: fontWeight.medium,
  },
  input: {
    height: 44,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.gray200,
    ...(Platform.OS === 'web' && {
      outline: 'none',
    }),
  },
  separator: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separatorText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
});

export default PriceRangeFilter;
