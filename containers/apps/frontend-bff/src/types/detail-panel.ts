export type DetailPanelState =
  | { type: "none" }
  | { type: "activity"; activityId: string }
  | { type: "face"; faceId: string };
