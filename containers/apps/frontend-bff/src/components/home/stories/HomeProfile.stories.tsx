import type { Meta, StoryObj } from '@storybook/react';
import HomeProfile from '../HomeProfile';
import { currentUser } from '@/mocks/users';
import { faces } from '@/mocks/faces';
import { seeds as activities } from '@/mocks/seeds';

const meta: Meta<typeof HomeProfile> = {
  title: 'Home/HomeProfile',
  component: HomeProfile,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof HomeProfile>;

const myFaces = faces.filter((f) => f.userId === 'user-1');
const myActivities = activities.filter((a) => a.userId === 'user-1');

export const Default: Story = {
  args: { user: currentUser, faces: myFaces, activities: myActivities },
};

export const NoActivities: Story = {
  args: { user: currentUser, faces: myFaces, activities: [] },
};
