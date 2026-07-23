import type { Meta, StoryObj } from '@storybook/react';
import ContextRail from '../ContextRail';
import type { Seed } from '@/types/seed';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';

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
  { id: 'face-1', userId: 'user-1', name: '読書', emoji: '📚', isPrivate: false },
  { id: 'face-2', userId: 'user-1', name: '映画', emoji: '🎬', isPrivate: false },
];

const now = new Date();
const mockSeeds: Seed[] = [
  {
    id: 'act-1',
    faceId: 'face-1',
    userId: 'user-1',
    body: '今日は「カラマーゾフの兄弟」を読んだ。',
    createdAt: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(),
  },
  {
    id: 'act-2',
    faceId: 'face-2',
    userId: 'user-1',
    body: '「パラサイト」を観た。',
    createdAt: new Date(now.getFullYear(), now.getMonth(), 3).toISOString(),
  },
];

const mockSubscribedFace: Face = {
  id: 'face-sub-1',
  userId: 'user-2',
  name: '珈琲',
  emoji: '☕',
  isPrivate: false,
};

const mockLatestSeedByFaceId: Record<string, Seed> = {
  'face-sub-1': {
    id: 'act-sub-1',
    faceId: 'face-sub-1',
    userId: 'user-2',
    body: '今朝の一杯',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
};

const mockUsers: UserProfile[] = [
  mockUser,
  {
    id: 'user-2',
    name: '佐藤 花子',
    avatar: {
      id: 'avatar-2',
      url: 'https://i.pravatar.cc/150?u=user-2',
    },
    badge: '💖',
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
    subscribedFaces: [],
    latestSeedByFaceId: {},
    users: mockUsers,
  },
};

export const WithSubscriptions: Story = {
  args: {
    user: mockUser,
    faces: mockFaces,
    seeds: mockSeeds,
    subscribedFaces: [mockSubscribedFace],
    latestSeedByFaceId: mockLatestSeedByFaceId,
    users: mockUsers,
  },
};
