import type { Meta, StoryObj } from '@storybook/react';
import ActivityFeed from '../ActivityFeed';
import { currentUser } from '@/mocks/users';
import { faces } from '@/mocks/faces';
import { activities } from '@/mocks/activities';

const meta: Meta<typeof ActivityFeed> = {
  title: 'Home/ActivityFeed',
  component: ActivityFeed,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ActivityFeed>;

const myFaces = faces.filter((f) => f.userId === 'user-1');
const myActivities = activities.filter((a) => a.userId === 'user-1');

export const AllFaces: Story = {
  args: { currentUser, faces: myFaces, activities: myActivities, selectedFaceId: null },
};

export const FilteredByFace: Story = {
  args: {
    currentUser,
    faces: myFaces,
    activities: myActivities,
    selectedFaceId: myFaces[0]?.id,
  },
};

export const Empty: Story = {
  args: { currentUser, faces: myFaces, activities: [], selectedFaceId: null },
};
