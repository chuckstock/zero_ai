import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { COLORS, FREE_PHOTO_LIMIT, PREMIUM_PRICE } from '../constants';

interface OnboardingScreenProps {
  onComplete: () => void;
  requestPermissions: () => Promise<boolean>;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
  requestPermissions,
}) => {
  const handleGetStarted = async () => {
    const granted = await requestPermissions();
    
    if (granted) {
      onComplete();
    } else {
      Alert.alert(
        'Permission Required',
        'SwipeClean needs access to your photos to help you clean up your camera roll. Please grant permission in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => {
            // In production, use Linking.openSettings()
            alert('Would open Settings app');
          }},
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>📸</Text>
        <Text style={styles.title}>Welcome to SwipeClean</Text>
        <Text style={styles.subtitle}>
          Clean up your camera roll with simple swipes
        </Text>

        <View style={styles.features}>
          <Feature
            emoji="👈"
            title="Swipe Left"
            description="Delete photos you don't need"
          />
          <Feature
            emoji="👉"
            title="Swipe Right"
            description="Keep the ones you love"
          />
          <Feature
            emoji="⚡"
            title="Lightning Fast"
            description="Clean hundreds of photos in minutes"
          />
        </View>

        <View style={styles.pricing}>
          <Text style={styles.pricingTitle}>Pricing</Text>
          <Text style={styles.pricingText}>
            ✓ Free for first {FREE_PHOTO_LIMIT} photos
          </Text>
          <Text style={styles.pricingText}>
            ✓ Unlock unlimited for ${PREMIUM_PRICE}
          </Text>
          <Text style={styles.pricingText}>
            ✓ One-time purchase, yours forever
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Photos are moved to Recently Deleted folder and can be restored within
          30 days
        </Text>
      </View>
    </SafeAreaView>
  );
};

interface FeatureProps {
  emoji: string;
  title: string;
  description: string;
}

const Feature: React.FC<FeatureProps> = ({ emoji, title, description }) => (
  <View style={styles.feature}>
    <Text style={styles.featureEmoji}>{emoji}</Text>
    <View style={styles.featureText}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginBottom: 48,
  },
  features: {
    gap: 24,
    marginBottom: 40,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureEmoji: {
    fontSize: 40,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  pricing: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  pricingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  pricingText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
