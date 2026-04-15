import { type Face } from "@/types/face";

// user-1（山田 太郎）のフェイス
const user1Faces: Face[] = [
  {
    id: "face-1-1",
    userId: "user-1",
    name: "読書",
    emoji: "📚",
    description: "読んだ本の感想や気になった一節を記録しています。",
    imageUrl: "https://picsum.photos/seed/books/400/200",
    isPrivate: false,
  },
  {
    id: "face-1-2",
    userId: "user-1",
    name: "映画",
    emoji: "🎬",
    description: "観た映画の感想・レビューをまとめています。",
    imageUrl: "https://picsum.photos/seed/movie/400/200",
    isPrivate: false,
  },
  {
    id: "face-1-3",
    userId: "user-1",
    name: "料理日記",
    emoji: "🍳",
    description: "作った料理のメモ。レシピや改善点を記録。",
    imageUrl: "https://picsum.photos/seed/cooking/400/200",
    isPrivate: false,
  },
  {
    id: "face-1-4",
    userId: "user-1",
    name: "今日の出来事",
    emoji: "📝",
    description: "日々の出来事や気づきをゆるく書き留める場所。",
    imageUrl: "https://picsum.photos/seed/diary/400/200",
    isPrivate: false,
  },
];

// user-2（佐藤 花子）のフェイス
const user2Faces: Face[] = [
  {
    id: "face-2-1",
    userId: "user-2",
    name: "読んだ本",
    emoji: "📖",
    description: "読書記録。主に小説・エッセイ中心です。",
    imageUrl: "https://picsum.photos/seed/hanako-books/400/200",
    isPrivate: false,
  },
  {
    id: "face-2-2",
    userId: "user-2",
    name: "カフェ巡り",
    emoji: "☕",
    description: "訪れたカフェの記録。雰囲気・味・おすすめポイントなど。",
    imageUrl: "https://picsum.photos/seed/cafe/400/200",
    isPrivate: false,
  },
  {
    id: "face-2-3",
    userId: "user-2",
    name: "旅行記",
    emoji: "✈️",
    description: "旅行の思い出と現地でのメモ。",
    imageUrl: "https://picsum.photos/seed/travel/400/200",
    isPrivate: false,
  },
];

// user-3（鈴木 一郎）のフェイス
const user3Faces: Face[] = [
  {
    id: "face-3-1",
    userId: "user-3",
    name: "ゲーム記録",
    emoji: "🎮",
    description: "クリアしたゲームや進捗ログ。",
    imageUrl: "https://picsum.photos/seed/game/400/200",
    isPrivate: false,
  },
  {
    id: "face-3-2",
    userId: "user-3",
    name: "アニメ感想",
    emoji: "🎌",
    description: "観たアニメの感想・考察をまとめています。",
    imageUrl: "https://picsum.photos/seed/anime/400/200",
    isPrivate: false,
  },
  {
    id: "face-3-3",
    userId: "user-3",
    name: "筋トレログ",
    emoji: "💪",
    description: "トレーニングの記録。重量・セット数・体感など。",
    imageUrl: "https://picsum.photos/seed/gym/400/200",
    isPrivate: false,
  },
  {
    id: "face-3-4",
    userId: "user-3",
    name: "技術メモ",
    emoji: "💻",
    description: "プログラミングやツールに関するメモ・TIL。",
    isPrivate: false,
  },
];

// user-4（田中 美咲）のフェイス
const user4Faces: Face[] = [
  {
    id: "face-4-1",
    userId: "user-4",
    name: "料理レシピ",
    emoji: "🥗",
    description: "自作レシピと食べたもの記録。",
    imageUrl: "https://picsum.photos/seed/recipe/400/200",
    isPrivate: false,
  },
  {
    id: "face-4-2",
    userId: "user-4",
    name: "映画・ドラマ",
    emoji: "📺",
    description: "観た映画・ドラマのひとことレビュー。",
    imageUrl: "https://picsum.photos/seed/drama/400/200",
    isPrivate: false,
  },
  {
    id: "face-4-3",
    userId: "user-4",
    name: "植物育成",
    emoji: "🌿",
    description: "ベランダの植物たちの成長記録。",
    imageUrl: "https://picsum.photos/seed/plants/400/200",
    isPrivate: false,
  },
];

export const faces: Face[] = [
  ...user1Faces,
  ...user2Faces,
  ...user3Faces,
  ...user4Faces,
];
