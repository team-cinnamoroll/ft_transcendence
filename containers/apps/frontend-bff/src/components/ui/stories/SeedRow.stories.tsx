import type { Meta, StoryObj } from '@storybook/react';
import SeedRow from '../SeedRow';

const mockFace = {
  id: 'face-1',
  userId: 'user-1',
  name: '読書',
  emoji: '📚',
  isPrivate: false,
};

const mockActivity = {
  id: 'act-1',
  faceId: 'face-1',
  userId: 'user-1',
  body: '今日は「カラマーゾフの兄弟」を読み始めた。序盤からすでに濃密な人物描写に引き込まれる。',
  createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
};

const mockActivityLong = {
  id: 'act-2',
  faceId: 'face-1',
  userId: 'user-1',
  body: 'a'.repeat(300),
  createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
};

const mockActivityWithLinks = {
  ...mockActivity,
  id: 'act-3',
  linkedActivityIds: ['act-ref-1', 'act-ref-2'],
};

const meta: Meta<typeof SeedRow> = {
  title: 'UI/SeedRow',
  component: SeedRow,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 560, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SeedRow>;

export const Default: Story = {
  args: { activity: mockActivity, face: mockFace },
};

export const LongBody: Story = {
  args: { activity: mockActivityLong, face: mockFace },
};

export const WithLinks: Story = {
  args: { activity: mockActivityWithLinks, face: mockFace, showActions: true },
};

export const WithHandle: Story = {
  args: { activity: mockActivity, face: mockFace, handle: 'yamada_t' },
};
