export type Notification =
  | {
      id: string;
      type: "link";
      fromUserId: string;
      activityId: string;
      createdAt: string;
    }
  | {
      id: string;
      type: "subscribe";
      fromUserId: string;
      faceId: string;
      createdAt: string;
    };
