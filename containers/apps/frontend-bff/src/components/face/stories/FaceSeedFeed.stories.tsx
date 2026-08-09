import type { Meta, StoryObj } from '@storybook/react';
import FaceSeedFeed from '../FaceSeedFeed';
import { faces } from '@/mocks/faces';
import { users } from '@/mocks/users';
import { seeds } from '@/mocks/seeds';
import { FACE_IDS } from '@/mocks/ids';

const meta: Meta<typeof FaceSeedFeed> = {
  title: 'Face/FaceSeedFeed',
  component: FaceSeedFeed,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FaceSeedFeed>;

const face = faces.find((f) => f.id === FACE_IDS.face11)!;
const faceSeeds = seeds.filter((s) => s.faceId === face.id);

export const Default: Story = {
  args: { face, seeds: faceSeeds, users },
};

export const Empty: Story = {
  args: { face, seeds: [], users },
};

export const OtherFace: Story = {
  args: {
    face: faces.find((f) => f.id === FACE_IDS.face12) ?? face,
    seeds: seeds.filter((s) => s.faceId === FACE_IDS.face12),
    users,
  },
};
