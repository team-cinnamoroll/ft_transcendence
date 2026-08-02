import { type Face } from '@/types/face';
import { USER_IDS, FACE_IDS } from './ids';

// user-1（山田 太郎）のフェイス
const user1Faces: Face[] = [
  {
    id: FACE_IDS.face11,
    userId: USER_IDS.user1,
    name: '読書',
    emoji: '📚',
    description: '読んだ本の感想や気になった一節を記録しています。',
    image: { id: 'image1', url: 'https://picsum.photos/seed/books/400/200' },
    visibility: 'public',
  },
  {
    id: FACE_IDS.face12,
    userId: USER_IDS.user1,
    name: '映画',
    emoji: '🎬',
    description: '観た映画の感想・レビューをまとめています。',
    image: { id: 'image2', url: 'https://picsum.photos/seed/movie/400/200' },
    visibility: 'public',
  },
  {
    id: FACE_IDS.face13,
    userId: USER_IDS.user1,
    name: '料理日記',
    emoji: '🍳',
    description: '作った料理のメモ。レシピや改善点を記録。',
    image: { id: 'image3', url: 'https://picsum.photos/seed/cooking/400/200' },
    visibility: 'public',
  },
  {
    id: FACE_IDS.face14,
    userId: USER_IDS.user1,
    name: '今日の出来事',
    emoji: '📝',
    description: '日々の出来事や気づきをゆるく書き留める場所。',
    image: { id: 'image4', url: 'https://picsum.photos/seed/diary/400/200' },
    visibility: 'public',
  },
];

// user-2（佐藤 花子）のフェイス
const user2Faces: Face[] = [
  {
    id: FACE_IDS.face21,
    userId: USER_IDS.user2,
    name: '読んだ本',
    emoji: '📖',
    description: '読書記録。主に小説・エッセイ中心です。',
    image: { id: 'image5', url: 'https://picsum.photos/seed/hanako-books/400/200' },
    visibility: 'public',
  },
  {
    id: FACE_IDS.face22,
    userId: USER_IDS.user2,
    name: 'カフェ巡り',
    emoji: '☕',
    description: '訪れたカフェの記録。雰囲気・味・おすすめポイントなど。',
    image: { id: 'image6', url: 'https://picsum.photos/seed/cafe/400/200' },
    visibility: 'public',
  },
  {
    id: FACE_IDS.face23,
    userId: USER_IDS.user2,
    name: '旅行記',
    emoji: '✈️',
    description: '旅行の思い出と現地でのメモ。',
    image: { id: 'image7', url: 'https://picsum.photos/seed/travel/400/200' },
    visibility: 'public',
  },
];

// user-3（鈴木 一郎）のフェイス
const user3Faces: Face[] = [
  {
    id: FACE_IDS.face31,
    userId: USER_IDS.user3,
    name: 'ゲーム記録',
    emoji: '🎮',
    description: 'クリアしたゲームや進捗ログ。',
    image: { id: 'image8', url: 'https://picsum.photos/seed/game/400/200' },
    visibility: 'public',
  },
  {
    id: FACE_IDS.face32,
    userId: USER_IDS.user3,
    name: 'アニメ感想',
    emoji: '🎌',
    description: '観たアニメの感想・考察をまとめています。',
    image: { id: 'image9', url: 'https://picsum.photos/seed/anime/400/200' },
    visibility: 'public',
  },
  {
    id: FACE_IDS.face33,
    userId: USER_IDS.user3,
    name: '筋トレログ',
    emoji: '💪',
    description: 'トレーニングの記録。重量・セット数・体感など。',
    image: { id: 'image10', url: 'https://picsum.photos/seed/gym/400/200' },
    visibility: 'public',
  },
  {
    id: FACE_IDS.face34,
    userId: USER_IDS.user3,
    name: '技術メモ',
    emoji: '💻',
    description: 'プログラミングやツールに関するメモ・TIL。',
    image: null,
    visibility: 'public',
  },
];

// user-4（田中 美咲）のフェイス
const user4Faces: Face[] = [
  {
    id: FACE_IDS.face41,
    userId: USER_IDS.user4,
    name: '料理レシピ',
    emoji: '🥗',
    description: '自作レシピと食べたもの記録。',
    image: { id: 'image11', url: 'https://picsum.photos/seed/recipe/400/200' },
    visibility: 'public',
  },
  {
    id: FACE_IDS.face42,
    userId: USER_IDS.user4,
    name: '映画・ドラマ',
    emoji: '📺',
    description: '観た映画・ドラマのひとことレビュー。',
    image: { id: 'image12', url: 'https://picsum.photos/seed/drama/400/200' },
    visibility: 'public',
  },
  {
    id: FACE_IDS.face43,
    userId: USER_IDS.user4,
    name: '植物育成',
    emoji: '🌿',
    description: 'ベランダの植物たちの成長記録。',
    image: { id: 'image13', url: 'https://picsum.photos/seed/plants/400/200' },
    visibility: 'public',
  },
];

export const faces: Face[] = [...user1Faces, ...user2Faces, ...user3Faces, ...user4Faces];
