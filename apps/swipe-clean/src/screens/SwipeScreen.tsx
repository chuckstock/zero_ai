import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { PhotoCard } from '../components/PhotoCard';
import { SwipeButtons } from '../components/SwipeButtons';
import { ProgressBar } from '../components/ProgressBar';
import { StatsWidget } from '../components/StatsWidget';
import { usePhotos } from '../hooks/usePhotos';
import { useStats } from '../hooks/useStats';
import { COLORS, FREE_PHOTO_LIMIT } from '../constants';

interface SwipeScreenProps {
  isPremium: boolean;
  onShowPaywall: () => void;
  onShowStats: () => void;
}

export const SwipeScreen: React.FC<SwipeScreenProps> = ({
  isPremium,
  onShowPaywall,
  onShowStats,
}) => {
  const {
    currentPhoto,
    currentIndex,
    totalCount,
    loading,
    nextPhoto,
    previousPhoto,
    deletePhoto,
  } = usePhotos();

  const {
    stats,
    recordKeep,
    recordDelete,
    undo,
    canUndo,
    formatStorage,
  } = useStats();

  // Check if user hit free limit
  useEffect(() => {
    if (!isPremium && stats.photosReviewed >= FREE_PHOTO_LIMIT) {
      onShowPaywall();
    }
  }, [stats.photosReviewed, isPremium, onShowPaywall]);

  const handleSwipeLeft = async () => {
    if (!currentPhoto) return;

    const success = await deletePhoto(currentPhoto.id);
    if (success) {
      recordDelete(currentPhoto.id, currentPhoto.fileSize);
      nextPhoto();
    }
  };

  const handleSwipeRight = () => {
    if (!currentPhoto) return;

    recordKeep(currentPhoto.id);
    nextPhoto();
  };

  const handleUndo = () => {
    const lastAction = undo();
    if (lastAction) {
      previousPhoto();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading photos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentPhoto) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>All Done!</Text>
          <Text style={styles.doneSubtitle}>
            You've reviewed all your photos
          </Text>

          <TouchableOpacity
            style={styles.viewStatsButton}
            onPress={onShowStats}
          >
            <Text style={styles.viewStatsButtonText}>View Stats</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isDisabled = !isPremium && stats.photosReviewed >= FREE_PHOTO_LIMIT;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onShowStats}>
          <Text style={styles.statsButton}>Stats</Text>
        </TouchableOpacity>
        <Text style={styles.title}>SwipeClean</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Progress */}
      <ProgressBar
        current={stats.photosReviewed}
        total={totalCount}
        isPremium={isPremium}
        freeLimit={FREE_PHOTO_LIMIT}
      />

      {/* Photo Card */}
      <View style={styles.cardContainer}>
        <PhotoCard
          photo={currentPhoto}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
        />
      </View>

      {/* Controls */}
      <SwipeButtons
        onDelete={handleSwipeLeft}
        onKeep={handleSwipeRight}
        onUndo={handleUndo}
        canUndo={canUndo}
        disabled={isDisabled}
      />

      {/* Stats */}
      <StatsWidget stats={stats} formatStorage={formatStorage} />

      {/* Hit limit message */}
      {isDisabled && (
        <View style={styles.limitMessage}>
          <Text style={styles.limitText}>
            Free limit reached! Upgrade to continue.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statsButton: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  doneEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  doneTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  doneSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  viewStatsButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  viewStatsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  limitMessage: {
    backgroundColor: COLORS.warning,
    padding: 12,
    alignItems: 'center',
  },
  limitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
