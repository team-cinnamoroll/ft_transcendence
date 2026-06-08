import type { Meta, StoryObj } from '@storybook/react';
import FaceDetailClient from '../FaceDetailClient';
import { faces } from '@/mocks/faces';
import { seeds } from '@/mocks/seeds';
import { users } from '@/mocks/users';

const face = faces.find((f) => f.id === 'face-1-1')!;
const faceSeeds = seeds.filter((s) => s.faceId === face.id);

const meta: Meta<typeof FaceDetailClient> = {
  title: 'Face/FaceDetailClient',
  component: FaceDetailClient,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof FaceDetailClient>;

export const AsOwner: Story = {
  args: {
    face,
    isOwner: true,
    seeds: faceSeeds,
    users,
  },
};

export const AsVisitor: Story = {
  args: {
    face,
    isOwner: false,
    seeds: faceSeeds,
    users,
  },
};
