import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SessionStats } from '../types';
import { COLORS } from '../constants';

interface StatsWidgetProps {
  stats: SessionStats;
  formatStorage: (bytes: number) => string;
}

export const StatsWidget: React.FC<StatsWidgetProps> = ({
  stats,
  formatStorage,
}) => {
  return (
    <View style={styles.container}>
      <StatItem
        label="Reviewed"
        value={stats.photosReviewed.toString()}
        color={COLORS.primary}
      />
      <StatItem
        label="Deleted"
        value={stats.photosDeleted.toString()}
        color={COLORS.danger}
      />
      <StatItem
        label="Kept"
        value={stats.photosKept.toString()}
        color={COLORS.success}
      />
      <StatItem
        label="Saved"
        value={formatStorage(stats.storageSaved)}
        color={COLORS.warning}
      />
    </View>
  );
};

interface StatItemProps {
  label: string;
  value: string;
  color: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, color }) => (
  <View style={styles.statItem}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
