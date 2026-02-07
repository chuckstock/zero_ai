export interface Photo {
  id: string;
  uri: string;
  filename: string;
  width: number;
  height: number;
  creationTime: number;
  fileSize: number;
  mediaType: 'photo' | 'video' | 'audio' | 'unknown';
}

export interface SessionStats {
  photosReviewed: number;
  photosDeleted: number;
  photosKept: number;
  storageSaved: number; // bytes
  sessionStartTime: number;
}

export interface PurchaseState {
  isPremium: boolean;
  purchaseDate: number | null;
  transactionId: string | null;
}

export interface SwipeAction {
  photoId: string;
  action: 'keep' | 'delete';
  timestamp: number;
}

export type SwipeDirection = 'left' | 'right';
