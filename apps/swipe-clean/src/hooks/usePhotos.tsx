import { useState, useEffect, useCallback } from 'react';
import { Photo } from '../types';
import { photoService } from '../services/photoService';
import { PHOTOS_PER_BATCH } from '../constants';

export const usePhotos = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);

  // Request permissions
  const requestPermissions = useCallback(async () => {
    const granted = await photoService.requestPermissions();
    setHasPermission(granted);
    return granted;
  }, []);

  // Load initial photos
  const loadInitialPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const { photos: loadedPhotos, hasMore: more, endCursor: cursor } =
        await photoService.loadPhotos();
      
      setPhotos(loadedPhotos);
      setHasMore(more);
      setEndCursor(cursor);
      setCurrentIndex(0);

      // Get total count
      const count = await photoService.getTotalPhotoCount();
      setTotalCount(count);
    } catch (error) {
      console.error('Error loading initial photos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more photos
  const loadMore = useCallback(async () => {
    if (!hasMore || !endCursor) return;

    try {
      const { photos: loadedPhotos, hasMore: more, endCursor: cursor } =
        await photoService.loadPhotos(endCursor, PHOTOS_PER_BATCH);
      
      setPhotos((prev) => [...prev, ...loadedPhotos]);
      setHasMore(more);
      setEndCursor(cursor);
    } catch (error) {
      console.error('Error loading more photos:', error);
    }
  }, [hasMore, endCursor]);

  // Get current photo
  const currentPhoto = photos[currentIndex] || null;

  // Move to next photo
  const nextPhoto = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      
      // Load more if getting close to end
      if (currentIndex >= photos.length - 5 && hasMore) {
        loadMore();
      }
    }
  }, [currentIndex, photos.length, hasMore, loadMore]);

  // Move to previous photo
  const previousPhoto = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Delete photo
  const deletePhoto = useCallback(async (photoId: string) => {
    const success = await photoService.deletePhoto(photoId);
    if (success) {
      // Remove from local array
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      setTotalCount((prev) => prev - 1);
    }
    return success;
  }, []);

  // Initialize
  useEffect(() => {
    const init = async () => {
      const granted = await photoService.checkPermissions();
      setHasPermission(granted);
      
      if (granted) {
        await loadInitialPhotos();
      } else {
        setLoading(false);
      }
    };

    init();
  }, [loadInitialPhotos]);

  return {
    photos,
    currentPhoto,
    currentIndex,
    totalCount,
    loading,
    hasMore,
    hasPermission,
    requestPermissions,
    nextPhoto,
    previousPhoto,
    deletePhoto,
    loadMore,
    reload: loadInitialPhotos,
  };
};
