import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { SessionStats } from '../types';
import { COLORS } from '../constants';

interface StatsScreenProps {
  stats: SessionStats;
  formatStorage: (bytes: number) => string;
  onClose: () => void;
  onReset: () => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({
  stats,
  formatStorage,
  onClose,
  onReset,
}) => {
  const sessionDuration = Date.now() - stats.sessionStartTime;
  const minutes = Math.floor(sessionDuration / 1000 / 60);
  const photosPerMinute =
    minutes > 0 ? Math.round(stats.photosReviewed / minutes) : 0;

  const deleteRate =
    stats.photosReviewed > 0
      ? Math.round((stats.photosDeleted / stats.photosReviewed) * 100)
      : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Session Stats</Text>
          <View style={{ width: 70 }} />
        </View>

        {/* Main Stats */}
        <View style={styles.mainStats}>
          <Text style={styles.emoji}>📊</Text>
          <Text style={styles.mainValue}>{stats.photosReviewed}</Text>
          <Text style={styles.mainLabel}>Photos Reviewed</Text>
        </View>

        {/* Grid Stats */}
        <View style={styles.grid}>
          <StatCard
            label="Deleted"
            value={stats.photosDeleted.toString()}
            color={COLORS.danger}
            icon="🗑️"
          />
          <StatCard
            label="Kept"
            value={stats.photosKept.toString()}
            color={COLORS.success}
            icon="✓"
          />
          <StatCard
            label="Storage Saved"
            value={formatStorage(stats.storageSaved)}
            color={COLORS.warning}
            icon="💾"
          />
          <StatCard
            label="Delete Rate"
            value={`${deleteRate}%`}
            color={COLORS.primary}
            icon="📈"
          />
        </View>

        {/* Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.performanceRow}>
            <Text style={styles.performanceLabel}>Session Duration</Text>
            <Text style={styles.performanceValue}>
              {minutes} {minutes === 1 ? 'minute' : 'minutes'}
            </Text>
          </View>
          <View style={styles.performanceRow}>
            <Text style={styles.performanceLabel}>Photos per Minute</Text>
            <Text style={styles.performanceValue}>{photosPerMinute}</Text>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.resetButton}
          onPress={onReset}
        >
          <Text style={styles.resetButtonText}>Reset Stats</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Stats are reset each session. Deleted photos can be found in your
          Recently Deleted folder.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  color: string;
  icon: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color, icon }) => (
  <View style={styles.statCard}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  mainStats: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  mainValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  mainLabel: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  performanceLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  resetButton: {
    backgroundColor: COLORS.danger,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
