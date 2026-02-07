import AsyncStorage from '@react-native-async-storage/async-storage';
import { PurchaseState, SessionStats } from '../types';
import { STORAGE_KEYS } from '../constants';

export const storageService = {
  // Purchase State
  async getPurchaseState(): Promise<PurchaseState | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PURCHASE_STATE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting purchase state:', error);
      return null;
    }
  },

  async savePurchaseState(state: PurchaseState): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.PURCHASE_STATE,
        JSON.stringify(state)
      );
    } catch (error) {
      console.error('Error saving purchase state:', error);
    }
  },

  // Session Stats
  async getSessionStats(): Promise<SessionStats | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_STATS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting session stats:', error);
      return null;
    }
  },

  async saveSessionStats(stats: SessionStats): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SESSION_STATS,
        JSON.stringify(stats)
      );
    } catch (error) {
      console.error('Error saving session stats:', error);
    }
  },

  async clearSessionStats(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SESSION_STATS);
    } catch (error) {
      console.error('Error clearing session stats:', error);
    }
  },

  // Onboarding
  async isOnboardingComplete(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
      return value === 'true';
    } catch (error) {
      console.error('Error checking onboarding:', error);
      return false;
    }
  },

  async setOnboardingComplete(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
    } catch (error) {
      console.error('Error setting onboarding complete:', error);
    }
  },

  // Clear all data
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SESSION_STATS,
        STORAGE_KEYS.HISTORY,
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  },
};
