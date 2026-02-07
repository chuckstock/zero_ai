import { useState, useEffect, useCallback } from 'react';
import { SessionStats, SwipeAction } from '../types';
import { storageService } from '../services/storageService';

const initialStats: SessionStats = {
  photosReviewed: 0,
  photosDeleted: 0,
  photosKept: 0,
  storageSaved: 0,
  sessionStartTime: Date.now(),
};

export const useStats = () => {
  const [stats, setStats] = useState<SessionStats>(initialStats);
  const [history, setHistory] = useState<SwipeAction[]>([]);

  // Load stats from storage
  useEffect(() => {
    const loadStats = async () => {
      const savedStats = await storageService.getSessionStats();
      if (savedStats) {
        setStats(savedStats);
      } else {
        // Start fresh session
        const newStats = { ...initialStats, sessionStartTime: Date.now() };
        setStats(newStats);
        await storageService.saveSessionStats(newStats);
      }
    };

    loadStats();
  }, []);

  // Save stats whenever they change
  useEffect(() => {
    storageService.saveSessionStats(stats);
  }, [stats]);

  // Record keep action
  const recordKeep = useCallback((photoId: string) => {
    setStats((prev) => ({
      ...prev,
      photosReviewed: prev.photosReviewed + 1,
      photosKept: prev.photosKept + 1,
    }));

    const action: SwipeAction = {
      photoId,
      action: 'keep',
      timestamp: Date.now(),
    };
    setHistory((prev) => [...prev, action]);
  }, []);

  // Record delete action
  const recordDelete = useCallback((photoId: string, fileSize: number = 0) => {
    setStats((prev) => ({
      ...prev,
      photosReviewed: prev.photosReviewed + 1,
      photosDeleted: prev.photosDeleted + 1,
      storageSaved: prev.storageSaved + fileSize,
    }));

    const action: SwipeAction = {
      photoId,
      action: 'delete',
      timestamp: Date.now(),
    };
    setHistory((prev) => [...prev, action]);
  }, []);

  // Undo last action
  const undo = useCallback((): SwipeAction | null => {
    if (history.length === 0) return null;

    const lastAction = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

    // Revert stats
    setStats((prev) => ({
      ...prev,
      photosReviewed: Math.max(0, prev.photosReviewed - 1),
      photosDeleted:
        lastAction.action === 'delete'
          ? Math.max(0, prev.photosDeleted - 1)
          : prev.photosDeleted,
      photosKept:
        lastAction.action === 'keep'
          ? Math.max(0, prev.photosKept - 1)
          : prev.photosKept,
    }));

    return lastAction;
  }, [history]);

  // Reset stats
  const reset = useCallback(async () => {
    const newStats = { ...initialStats, sessionStartTime: Date.now() };
    setStats(newStats);
    setHistory([]);
    await storageService.saveSessionStats(newStats);
  }, []);

  // Clear stats
  const clear = useCallback(async () => {
    await storageService.clearSessionStats();
    setStats(initialStats);
    setHistory([]);
  }, []);

  // Format storage saved
  const formatStorage = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round(bytes / Math.pow(k, i) * 10) / 10} ${sizes[i]}`;
  };

  return {
    stats,
    history,
    recordKeep,
    recordDelete,
    undo,
    reset,
    clear,
    formatStorage,
    canUndo: history.length > 0,
  };
};
