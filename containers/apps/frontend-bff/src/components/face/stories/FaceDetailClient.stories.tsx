import type { Meta, StoryObj } from '@storybook/react';
import FaceDetailClient from '../FaceDetailClient';
import { faces } from '@/mocks/faces';
import { seeds } from '@/mocks/seeds';
import { users } from '@/mocks/users';
import { FACE_IDS } from '@/mocks/ids';

const face = faces.find((f) => f.id === FACE_IDS.face11)!;
const faceSeeds = seeds.filter((s) => s.faceId === face.id);

const meta: Meta<typeof FaceDetailClient> = {
  title: 'Face/FaceDetailClient',
  component: FaceDetailClient,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof FaceDetailClient>;

export const Default: Story = {
  args: {
    face,
    seeds: faceSeeds,
    users,
  },
};
