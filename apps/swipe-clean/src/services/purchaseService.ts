import * as InAppPurchases from 'expo-in-app-purchases';
import { PurchaseState } from '../types';
import { PRODUCT_ID } from '../constants';
import { storageService } from './storageService';

export const purchaseService = {
  // Initialize IAP
  async initialize(): Promise<void> {
    try {
      await InAppPurchases.connectAsync();
    } catch (error) {
      console.error('Error initializing IAP:', error);
    }
  },

  // Disconnect IAP
  async disconnect(): Promise<void> {
    try {
      await InAppPurchases.disconnectAsync();
    } catch (error) {
      console.error('Error disconnecting IAP:', error);
    }
  },

  // Get product info
  async getProductInfo() {
    try {
      const { results } = await InAppPurchases.getProductsAsync([PRODUCT_ID]);
      return results?.[0] || null;
    } catch (error) {
      console.error('Error getting product info:', error);
      return null;
    }
  },

  // Purchase product
  async purchaseProduct(): Promise<PurchaseState | null> {
    try {
      await InAppPurchases.purchaseItemAsync(PRODUCT_ID);
      
      // Get purchase history
      const { results } = await InAppPurchases.getPurchaseHistoryAsync();
      const purchase = results?.find((p) => p.productId === PRODUCT_ID);

      if (purchase) {
        const purchaseState: PurchaseState = {
          isPremium: true,
          purchaseDate: Date.now(),
          transactionId: purchase.orderId || null,
        };

        await storageService.savePurchaseState(purchaseState);
        return purchaseState;
      }

      return null;
    } catch (error: any) {
      if (error.code === 'USER_CANCELLED') {
        console.log('User cancelled purchase');
      } else {
        console.error('Error purchasing product:', error);
      }
      return null;
    }
  },

  // Restore purchases
  async restorePurchases(): Promise<PurchaseState | null> {
    try {
      const { results } = await InAppPurchases.getPurchaseHistoryAsync();
      const purchase = results?.find((p) => p.productId === PRODUCT_ID);

      if (purchase) {
        const purchaseState: PurchaseState = {
          isPremium: true,
          purchaseDate: Date.now(),
          transactionId: purchase.orderId || null,
        };

        await storageService.savePurchaseState(purchaseState);
        return purchaseState;
      }

      return null;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      return null;
    }
  },

  // Check if user has purchased
  async checkPurchaseStatus(): Promise<boolean> {
    try {
      // Check local storage first
      const localState = await storageService.getPurchaseState();
      if (localState?.isPremium) {
        return true;
      }

      // Check with App Store
      const { results } = await InAppPurchases.getPurchaseHistoryAsync();
      const purchase = results?.find((p) => p.productId === PRODUCT_ID);

      if (purchase) {
        // Save to local storage
        const purchaseState: PurchaseState = {
          isPremium: true,
          purchaseDate: Date.now(),
          transactionId: purchase.orderId || null,
        };
        await storageService.savePurchaseState(purchaseState);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking purchase status:', error);
      return false;
    }
  },
};
