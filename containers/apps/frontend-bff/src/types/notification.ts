export type Notification =
  | {
      id: string;
      type: 'link';
      fromUserId: string;
      seedId: string;
      createdAt: string;
    }
  | {
      id: string;
      type: 'subscribe';
      fromUserId: string;
      faceId: string;
      createdAt: string;
    };
