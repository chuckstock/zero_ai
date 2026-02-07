import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS, PREMIUM_PRICE, PRODUCT_ID } from '../constants';

interface PaywallScreenProps {
  onPurchase: () => Promise<boolean>;
  onRestore: () => Promise<boolean>;
  onClose: () => void;
  productInfo: any;
}

export const PaywallScreen: React.FC<PaywallScreenProps> = ({
  onPurchase,
  onRestore,
  onClose,
  productInfo,
}) => {
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const success = await onPurchase();
      if (success) {
        Alert.alert(
          'Success!',
          'You now have unlimited access to SwipeClean.',
          [{ text: 'Continue', onPress: onClose }]
        );
      } else {
        Alert.alert(
          'Purchase Failed',
          'Something went wrong. Please try again.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Could not complete purchase');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      const success = await onRestore();
      if (success) {
        Alert.alert(
          'Restored!',
          'Your purchase has been restored.',
          [{ text: 'Continue', onPress: onClose }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'We couldn\'t find any previous purchases for this account.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Could not restore purchase');
    } finally {
      setPurchasing(false);
    }
  };

  const price = productInfo?.priceString || `$${PREMIUM_PRICE}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.emoji}>🚀</Text>
        <Text style={styles.title}>Unlock Unlimited</Text>
        <Text style={styles.subtitle}>
          Continue cleaning your camera roll without limits
        </Text>

        <View style={styles.features}>
          <Feature text="Unlimited photos" />
          <Feature text="One-time purchase" />
          <Feature text="No subscription" />
          <Feature text="Support indie development" />
        </View>

        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>One-time payment</Text>
          <Text style={styles.price}>{price}</Text>
        </View>

        <TouchableOpacity
          style={[styles.purchaseButton, purchasing && styles.buttonDisabled]}
          onPress={handlePurchase}
          disabled={purchasing}
          activeOpacity={0.8}
        >
          {purchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.purchaseButtonText}>
              Unlock Now for {price}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={purchasing}
        >
          <Text style={styles.restoreButtonText}>Restore Purchase</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Payment will be charged to your Apple ID account. The purchase is
          non-refundable and non-transferable.
        </Text>
      </View>
    </SafeAreaView>
  );
};

interface FeatureProps {
  text: string;
}

const Feature: React.FC<FeatureProps> = ({ text }) => (
  <View style={styles.feature}>
    <Text style={styles.checkmark}>✓</Text>
    <Text style={styles.featureText}>{text}</Text>
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
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeText: {
    fontSize: 24,
    color: COLORS.text,
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
    fontSize: 16,
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginBottom: 40,
  },
  features: {
    gap: 16,
    marginBottom: 32,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkmark: {
    fontSize: 20,
    color: COLORS.success,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 16,
    color: COLORS.text,
  },
  priceBox: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  price: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  purchaseButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  restoreButton: {
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  disclaimer: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
