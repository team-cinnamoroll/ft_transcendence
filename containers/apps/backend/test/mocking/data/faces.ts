export type MockFace = {
  /** スクリプト内でFaceを参照するためのキー */
  key: string;
  /** data/users.tsのkeyと対応する所有者 */
  userKey: string;
  name: string;
  emoji: string | null;
  description: string | null;
  visibility: 'public' | 'private';
  imageUrl?: string;
};

/**
 * プロフィール画面のFace一覧「もっと見る」ページング(#350)を確認できるよう、
 * mainUserに複数件のFaceを持たせるためのテーマ一覧。
 * mainUserの合計Face数は 開発ログ(memoriesFace) + このテーマ数 = 15件。
 * うち8件に imageUrl を設定し、画像あり/なしの両方の表示パターンを確認できるようにする。
 */
const EXTRA_FACE_THEMES: { name: string; emoji: string; imageUrl?: string }[] = [
  { name: '筋トレ記録', emoji: '💪', imageUrl: 'https://picsum.photos/seed/mock-strength/600/400' },
  { name: '登山日記', emoji: '⛰️', imageUrl: 'https://picsum.photos/seed/mock-hiking/600/400' },
  {
    name: 'ボードゲーム会',
    emoji: '🎲',
    imageUrl: 'https://picsum.photos/seed/mock-boardgame/600/400',
  },
  { name: '写真散歩', emoji: '📷', imageUrl: 'https://picsum.photos/seed/mock-photowalk/600/400' },
  {
    name: 'ガーデニング',
    emoji: '🌱',
    imageUrl: 'https://picsum.photos/seed/mock-gardening/600/400',
  },
  { name: 'DIY部屋づくり', emoji: '🔨' },
  { name: '資格勉強ログ', emoji: '📖', imageUrl: 'https://picsum.photos/seed/mock-study/600/400' },
  { name: 'ランニング記録', emoji: '🏃' },
  { name: 'ヨガ日記', emoji: '🧘', imageUrl: 'https://picsum.photos/seed/mock-yoga/600/400' },
  { name: '温泉巡り', emoji: '♨️' },
  { name: '天体観測', emoji: '🔭' },
  { name: '手芸ノート', emoji: '🧵' },
  {
    name: 'ペットの成長記録',
    emoji: '🐾',
    imageUrl: 'https://picsum.photos/seed/mock-pet/600/400',
  },
  { name: '落語鑑賞メモ', emoji: '🎭' },
];

const mainUserExtraFaces: MockFace[] = EXTRA_FACE_THEMES.map((theme, i) => ({
  key: `mainExtra${i + 1}`,
  userKey: 'mainUser',
  name: theme.name,
  emoji: theme.emoji,
  description: null,
  visibility: 'public',
  imageUrl: theme.imageUrl,
}));

export const faces: MockFace[] = [
  // ── mainUser: 草機能・「1年前の今日」検証用のメインFace ──────────────
  {
    key: 'memoriesFace',
    userKey: 'mainUser',
    name: '開発ログ',
    emoji: '💻',
    description: '日々の開発の記録。学んだこと、詰まったこと、直したことを書き留める。',
    visibility: 'public',
  },
  // ── mainUser: ページング検証用の残り24Face(合計25Face) ──────────────
  ...mainUserExtraFaces,

  // ── friendAccepted1: 読書 ──────────────────────────────
  {
    key: 'friendAccepted1Books',
    userKey: 'friendAccepted1',
    name: '読書記録',
    emoji: '📚',
    description: '読んだ本の感想や気になった一節を記録しています。',
    visibility: 'public',
    imageUrl: 'https://picsum.photos/seed/mock-books/600/400',
  },
  {
    key: 'friendAccepted1Cafe',
    userKey: 'friendAccepted1',
    name: 'カフェ巡り',
    emoji: '☕',
    description: '訪れたカフェの記録。雰囲気・味・おすすめポイントなど。',
    visibility: 'public',
  },

  // ── friendAccepted2: ゲーム・アニメ ──────────────────────
  {
    key: 'friendAccepted2Game',
    userKey: 'friendAccepted2',
    name: 'ゲーム記録',
    emoji: '🎮',
    description: 'クリアしたゲームや進捗ログ。',
    visibility: 'public',
    imageUrl: 'https://picsum.photos/seed/mock-game/600/400',
  },
  {
    key: 'friendAccepted2Anime',
    userKey: 'friendAccepted2',
    name: 'アニメ感想',
    emoji: '🎌',
    description: '観たアニメの感想・考察をまとめています。',
    visibility: 'public',
  },
  {
    key: 'friendAccepted2Movie',
    userKey: 'friendAccepted2',
    name: '映画メモ',
    emoji: '🎬',
    description: null,
    visibility: 'private',
  },

  // ── friendOutgoing: 料理・旅行 ────────────────────────────
  {
    key: 'friendOutgoingCooking',
    userKey: 'friendOutgoing',
    name: '料理日記',
    emoji: '🍳',
    description: '作った料理のメモ。レシピや改善点を記録。',
    visibility: 'public',
    imageUrl: 'https://picsum.photos/seed/mock-cooking/600/400',
  },
  {
    key: 'friendOutgoingTravel',
    userKey: 'friendOutgoing',
    name: '旅行記',
    emoji: '✈️',
    description: '旅行の思い出と現地でのメモ。',
    visibility: 'public',
  },
  {
    key: 'friendOutgoingCafe',
    userKey: 'friendOutgoing',
    name: 'スイーツ巡り',
    emoji: '🍰',
    description: null,
    visibility: 'public',
  },

  // ── friendIncoming: 技術メモ・筋トレ ──────────────────────
  {
    key: 'friendIncomingTech',
    userKey: 'friendIncoming',
    name: '技術メモ',
    emoji: '💡',
    description: 'プログラミングやツールに関するメモ・TIL。',
    visibility: 'public',
  },
  {
    key: 'friendIncomingWorkout',
    userKey: 'friendIncoming',
    name: '筋トレログ',
    emoji: '🏋️',
    description: 'トレーニングの記録。重量・セット数・体感など。',
    visibility: 'public',
    imageUrl: 'https://picsum.photos/seed/mock-workout/600/400',
  },

  // ── unrelatedUser: 今日の出来事 ───────────────────────────
  {
    key: 'unrelatedDiary',
    userKey: 'unrelatedUser',
    name: '今日の出来事',
    emoji: '📝',
    description: '日々の出来事や気づきをゆるく書き留める場所。',
    visibility: 'public',
  },
  {
    key: 'unrelatedPlants',
    userKey: 'unrelatedUser',
    name: '植物育成記録',
    emoji: '🌿',
    description: 'ベランダの植物たちの成長記録。',
    visibility: 'public',
    imageUrl: 'https://picsum.photos/seed/mock-plants/600/400',
  },
];
