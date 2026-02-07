import { useState, useEffect, useCallback } from 'react';
import { PurchaseState } from '../types';
import { purchaseService } from '../services/purchaseService';

export const usePurchase = () => {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [productInfo, setProductInfo] = useState<any>(null);

  // Initialize IAP
  useEffect(() => {
    const init = async () => {
      try {
        await purchaseService.initialize();
        
        // Check purchase status
        const hasPurchased = await purchaseService.checkPurchaseStatus();
        setIsPremium(hasPurchased);

        // Get product info
        const info = await purchaseService.getProductInfo();
        setProductInfo(info);
      } catch (error) {
        console.error('Error initializing purchase:', error);
      } finally {
        setLoading(false);
      }
    };

    init();

    // Cleanup
    return () => {
      purchaseService.disconnect();
    };
  }, []);

  // Purchase premium
  const purchase = useCallback(async (): Promise<boolean> => {
    setPurchasing(true);
    try {
      const state = await purchaseService.purchaseProduct();
      if (state?.isPremium) {
        setIsPremium(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error purchasing:', error);
      return false;
    } finally {
      setPurchasing(false);
    }
  }, []);

  // Restore purchases
  const restore = useCallback(async (): Promise<boolean> => {
    setPurchasing(true);
    try {
      const state = await purchaseService.restorePurchases();
      if (state?.isPremium) {
        setIsPremium(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error restoring:', error);
      return false;
    } finally {
      setPurchasing(false);
    }
  }, []);

  return {
    isPremium,
    loading,
    purchasing,
    productInfo,
    purchase,
    restore,
  };
};
