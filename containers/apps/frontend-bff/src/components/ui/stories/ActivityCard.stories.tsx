import type { Meta, StoryObj } from '@storybook/react';
import ActivityCard from '../ActivityCard';
import { currentUser } from '@/mocks/users';
import { faces } from '@/mocks/faces';
import { activities } from '@/mocks/activities';

const meta: Meta<typeof ActivityCard> = {
  title: 'UI/ActivityCard',
  component: ActivityCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ActivityCard>;

const face = faces[0]!;
const activity = activities.find((a) => a.faceId === face.id) ?? activities[0]!;

export const Default: Story = {
  args: {
    activity,
    user: currentUser,
    faceTitle: face.name,
    faceId: face.id,
  },
};

export const WithImage: Story = {
  args: {
    activity: activities.find((a) => a.imageUrls && a.imageUrls.length > 0) ?? activity,
    user: currentUser,
    faceTitle: face.name,
    faceId: face.id,
  },
};

export const Priority: Story = {
  args: {
    ...Default.args,
    priority: true,
  },
};
