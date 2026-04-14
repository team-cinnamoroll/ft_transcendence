import { type Face } from "@/types/face";
import { faces } from "@/mocks/faces";

// ─── 型（インターフェース）定義 ─────────────────────────────────

/** フェイス作成時の入力型（id・userId は自動付与のため不要） */
export type CreateFaceInput = Omit<Face, "id" | "userId">;

/** FaceRepository が提供するメソッドの型定義 */
export type FaceRepository = {
  /** 指定ユーザーのフェイス一覧を取得 */
  listByUserId: (userId: string) => Face[];
  /** ID でフェイスを1件取得（存在しない場合は undefined） */
  findById: (faceId: string) => Face | undefined;
  /** フェイスを作成（モック実装はダミー返却） */
  create: (userId: string, input: CreateFaceInput) => Face;
  /** 全フェイス一覧を取得（検索用） */
  listAll: () => Face[];
};

// ─── モック実装 ────────────────────────────────────────────────

export const faceRepository: FaceRepository = {
  listByUserId: (userId) => {
    return faces.filter((face) => face.userId === userId);
  },

  findById: (faceId) => {
    return faces.find((face) => face.id === faceId);
  },

  create: (userId, input) => {
    // モック実装: ダミーの ID を付与して返却するだけ（実際には保存しない）
    const newFace: Face = {
      id: `face-mock-${Date.now()}`,
      userId,
      ...input,
    };
    return newFace;
  },

  listAll: () => {
    return faces;
  },
};
