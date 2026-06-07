import type { Meta, StoryObj } from '@storybook/react';
import SeedRow from '../SeedRow';

const mockFace = {
  id: 'face-1',
  userId: 'user-1',
  name: '読書',
  emoji: '📚',
  isPrivate: false,
};

const mockSeed = {
  id: 'act-1',
  faceId: 'face-1',
  userId: 'user-1',
  body: '今日は「カラマーゾフの兄弟」を読み始めた。序盤からすでに濃密な人物描写に引き込まれる。',
  createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
};

const mockSeedLong = {
  id: 'act-2',
  faceId: 'face-1',
  userId: 'user-1',
  body: 'a'.repeat(300),
  createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
};

const mockSeedWithLinks = {
  ...mockSeed,
  id: 'act-3',
  linkedSeedIds: ['act-ref-1', 'act-ref-2'],
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
  args: { seed: mockSeed, face: mockFace },
};

export const LongBody: Story = {
  args: { seed: mockSeedLong, face: mockFace },
};

export const WithLinks: Story = {
  args: { seed: mockSeedWithLinks, face: mockFace, showActions: true },
};

export const WithHandle: Story = {
  args: { seed: mockSeed, face: mockFace, handle: 'yamada_t' },
};
