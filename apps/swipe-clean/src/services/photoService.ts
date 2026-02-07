import * as MediaLibrary from 'expo-media-library';
import type { Photo } from '../types';
import { PHOTOS_PER_BATCH } from '../constants';

export const photoService = {
  // Request permissions
  async requestPermissions(): Promise<boolean> {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  },

  async checkPermissions(): Promise<boolean> {
    const { status } = await MediaLibrary.getPermissionsAsync();
    return status === 'granted';
  },

  // Load photos from camera roll
  async loadPhotos(
    after?: string,
    limit: number = PHOTOS_PER_BATCH
  ): Promise<{ photos: Photo[]; hasMore: boolean; endCursor: string | null }> {
    try {
      const options: MediaLibrary.AssetsOptions = {
        first: limit,
        mediaType: [MediaLibrary.MediaType.photo],
        sortBy: [[MediaLibrary.SortBy.creationTime, false]], // Most recent first
      };

      if (after) {
        options.after = after;
      }

      const result = await MediaLibrary.getAssetsAsync(options);

      const photos: Photo[] = result.assets.map((asset) => ({
        id: asset.id,
        uri: asset.uri,
        filename: asset.filename,
        width: asset.width,
        height: asset.height,
        creationTime: asset.creationTime,
        fileSize: 0, // Not available from MediaLibrary
        mediaType: asset.mediaType as Photo['mediaType'],
      }));

      return {
        photos,
        hasMore: result.hasNextPage,
        endCursor: result.endCursor,
      };
    } catch (error) {
      console.error('Error loading photos:', error);
      return { photos: [], hasMore: false, endCursor: null };
    }
  },

  // Get total photo count
  async getTotalPhotoCount(): Promise<number> {
    try {
      const result = await MediaLibrary.getAssetsAsync({
        first: 1,
        mediaType: [MediaLibrary.MediaType.photo],
      });
      return result.totalCount;
    } catch (error) {
      console.error('Error getting photo count:', error);
      return 0;
    }
  },

  // Delete photo (moves to Recently Deleted on iOS)
  async deletePhoto(photoId: string): Promise<boolean> {
    try {
      await MediaLibrary.deleteAssetsAsync([photoId]);
      return true;
    } catch (error) {
      console.error('Error deleting photo:', error);
      return false;
    }
  },

  // Delete multiple photos
  async deletePhotos(photoIds: string[]): Promise<number> {
    try {
      let successCount = 0;
      
      // Delete in batches to avoid overwhelming the system
      const batchSize = 10;
      for (let i = 0; i < photoIds.length; i += batchSize) {
        const batch = photoIds.slice(i, i + batchSize);
        try {
          await MediaLibrary.deleteAssetsAsync(batch);
          successCount += batch.length;
        } catch (error) {
          console.error('Error deleting batch:', error);
        }
      }
      
      return successCount;
    } catch (error) {
      console.error('Error deleting photos:', error);
      return 0;
    }
  },

  // Get photo asset info
  async getPhotoInfo(photoId: string): Promise<MediaLibrary.Asset | null> {
    try {
      const asset = await MediaLibrary.getAssetInfoAsync(photoId);
      return asset;
    } catch (error) {
      console.error('Error getting photo info:', error);
      return null;
    }
  },
};
