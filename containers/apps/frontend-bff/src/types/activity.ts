export type Activity = {
  id: string;
  faceId: string;
  userId: string;
  body: string;
  imageUrls?: string[];
  linkedActivityIds?: string[];
  createdAt: string; // ISO 8601
};
