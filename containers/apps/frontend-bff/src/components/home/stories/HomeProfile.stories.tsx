import type { Meta, StoryObj } from '@storybook/react';
import HomeProfile from '../HomeProfile';
import { currentUser } from '@/mocks/users';
import { faces } from '@/mocks/faces';
import { seeds } from '@/mocks/seeds';

const meta: Meta<typeof HomeProfile> = {
  title: 'Home/HomeProfile',
  component: HomeProfile,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof HomeProfile>;

const myFaces = faces.filter((f) => f.userId === 'user-1');
const mySeeds = seeds.filter((s) => s.userId === 'user-1');

export const Default: Story = {
  args: { user: currentUser, faces: myFaces, seeds: mySeeds },
};

export const NoSeeds: Story = {
  args: { user: currentUser, faces: myFaces, seeds: [] },
};
