import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

interface ProgressBarProps {
  current: number;
  total: number;
  isPremium: boolean;
  freeLimit: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  isPremium,
  freeLimit,
}) => {
  const displayTotal = isPremium ? total : Math.min(freeLimit, total);
  const progress = displayTotal > 0 ? (current / displayTotal) * 100 : 0;
  const isNearLimit = !isPremium && current >= freeLimit * 0.8;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>
          {current} / {displayTotal} photos
        </Text>
        {!isPremium && (
          <Text style={[styles.freeLabel, isNearLimit && styles.warningText]}>
            Free: {freeLimit - current} left
          </Text>
        )}
      </View>
      
      <View style={styles.barBackground}>
        <View
          style={[
            styles.barFill,
            { width: `${Math.min(progress, 100)}%` },
            isNearLimit && styles.barWarning,
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  freeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  warningText: {
    color: COLORS.warning,
    fontWeight: '700',
  },
  barBackground: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  barWarning: {
    backgroundColor: COLORS.warning,
  },
});
