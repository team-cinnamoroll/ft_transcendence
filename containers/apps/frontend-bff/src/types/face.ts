export type Face = {
  id: string;
  userId: string;
  name: string; // title → name にリネーム
  emoji?: string;
  description?: string;
  imageUrl?: string;
  isPrivate: boolean; // MultiFace 新規フィールド（公開/非公開）
};
