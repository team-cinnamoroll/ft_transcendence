import type { Meta, StoryObj } from '@storybook/react';
import SeedDetailPage from '../SeedDetailPage';
import { faces } from '@/mocks/faces';
import { seeds } from '@/mocks/seeds';
import { users } from '@/mocks/users';

const face = faces.find((f) => f.id === 'face-1-1')!;
const seed = seeds.find((s) => s.faceId === 'face-1-1')!;
const linkedSeed = seeds.find((s) => s.faceId !== 'face-1-1')!;
const linkedFace = faces.find((f) => f.id === linkedSeed?.faceId) ?? faces[1];

const meta: Meta<typeof SeedDetailPage> = {
  title: 'Seed/SeedDetailPage',
  component: SeedDetailPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SeedDetailPage>;

export const AsOwner: Story = {
  args: {
    seed,
    face,
    author: users[0],
    isOwner: true,
    outgoingLinks: [],
    incomingLinks: [],
  },
};

export const AsVisitor: Story = {
  args: {
    seed,
    face,
    author: users[0],
    isOwner: false,
    outgoingLinks: [{ seed: linkedSeed, face: linkedFace }],
    incomingLinks: [{ seed: linkedSeed, face: linkedFace }],
  },
};
