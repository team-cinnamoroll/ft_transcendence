export type DetailPanelState =
  | { type: 'none' }
  | { type: 'seed'; seedId: string }
  | { type: 'face'; faceId: string };
