import { type UserProfile } from '@/types/user-profile';
import { USER_IDS } from './ids';

export const currentUser: UserProfile = {
  id: USER_IDS.user1,
  name: '山田 太郎',
  avatarUrl: 'https://i.pravatar.cc/150?u=user-1',
  badge: '🌟',
};

export const users: UserProfile[] = [
  currentUser,
  {
    id: USER_IDS.user2,
    name: '佐藤 花子',
    avatarUrl: 'https://i.pravatar.cc/150?u=user-2',
    badge: '📚',
  },
  {
    id: USER_IDS.user3,
    name: '鈴木 一郎',
    avatarUrl: 'https://i.pravatar.cc/150?u=user-3',
    badge: '🎮',
  },
  {
    id: USER_IDS.user4,
    name: '田中 美咲',
    avatarUrl: 'https://i.pravatar.cc/150?u=user-4',
    badge: '🍳',
  },
];
