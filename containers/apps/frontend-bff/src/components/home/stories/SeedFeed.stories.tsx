import type { Meta, StoryObj } from '@storybook/react';
import SeedFeed from '../SeedFeed';
import { currentUser } from '@/mocks/users';
import { faces } from '@/mocks/faces';
import { seeds } from '@/mocks/seeds';
import { USER_IDS } from '@/mocks/ids';

const meta: Meta<typeof SeedFeed> = {
  title: 'Home/SeedFeed',
  component: SeedFeed,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SeedFeed>;

const myFaces = faces.filter((f) => f.userId === USER_IDS.user1);
const mySeeds = seeds.filter((s) => s.userId === USER_IDS.user1);

export const AllFaces: Story = {
  args: { currentUser, faces: myFaces, seeds: mySeeds, selectedFaceId: null },
};

export const FilteredByFace: Story = {
  args: {
    currentUser,
    faces: myFaces,
    seeds: mySeeds,
    selectedFaceId: myFaces[0]?.id,
  },
};

export const Empty: Story = {
  args: { currentUser, faces: myFaces, seeds: [], selectedFaceId: null },
};
