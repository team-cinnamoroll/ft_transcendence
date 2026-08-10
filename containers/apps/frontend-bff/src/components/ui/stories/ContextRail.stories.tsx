import type { Meta, StoryObj } from '@storybook/react';
import ContextRail from '../ContextRail';
import type { Seed } from '@/types/seed';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import type { FriendProfileWithOnlineStatus } from '@/types/friendship';

const mockUser: UserProfile = {
  id: 'user-1',
  name: '山田 太郎',
  avatar: {
    id: 'avatar-1',
    url: 'https://i.pravatar.cc/150?u=user-1',
  },
  badge: '🌟',
};

const mockFaces: Face[] = [
  {
    id: 'face-1',
    userId: 'user-1',
    name: '読書',
    emoji: '📚',
    visibility: 'public',
    description: '読書記録',
    image: null,
  },
  {
    id: 'face-2',
    userId: 'user-1',
    name: '映画',
    emoji: '🎬',
    visibility: 'public',
    description: '映画記録',
    image: null,
  },
];

const now = new Date();
const mockSeeds: Seed[] = [
  {
    id: 'act-1',
    faceId: 'face-1',
    userId: 'user-1',
    body: '今日は「カラマーゾフの兄弟」を読んだ。',
    images: [],
    createdAt: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(),
    updatedAt: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(),
  },
  {
    id: 'act-2',
    faceId: 'face-2',
    userId: 'user-1',
    body: '「パラサイト」を観た。',
    images: [],
    createdAt: new Date(now.getFullYear(), now.getMonth(), 3).toISOString(),
    updatedAt: new Date(now.getFullYear(), now.getMonth(), 3).toISOString(),
  },
];

const mockFriends: FriendProfileWithOnlineStatus[] = [
  {
    friendshipId: 'friendship-1',
    friendProfile: {
      id: 'user-2',
      name: '佐藤 花子',
      avatar: {
        id: 'avatar-2',
        url: 'https://i.pravatar.cc/150?u=user-2',
      },
      badge: '💖',
    },
    becameFriendsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    isOnline: true,
  },
  {
    friendshipId: 'friendship-2',
    friendProfile: {
      id: 'user-3',
      name: '鈴木 一郎',
      avatar: null,
      badge: null,
    },
    becameFriendsAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    isOnline: false,
  },
];

const meta: Meta<typeof ContextRail> = {
  title: 'UI/ContextRail',
  component: ContextRail,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ width: 340, background: 'var(--mf-bg-light)', padding: '0 20px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ContextRail>;

export const WritingRail: Story = {
  args: {
    user: mockUser,
    faces: mockFaces,
    seeds: mockSeeds,
    friends: [],
  },
};

export const WithFriends: Story = {
  args: {
    user: mockUser,
    faces: mockFaces,
    seeds: mockSeeds,
    friends: mockFriends,
  },
};
