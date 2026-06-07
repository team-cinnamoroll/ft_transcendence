import type { Meta, StoryObj } from '@storybook/react';
import FaceActivityFeed from '../FaceActivityFeed';
import { faces } from '@/mocks/faces';
import { users } from '@/mocks/users';
import { seeds as activities } from '@/mocks/seeds';

const meta: Meta<typeof FaceActivityFeed> = {
  title: 'Face/FaceActivityFeed',
  component: FaceActivityFeed,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FaceActivityFeed>;

const face = faces.find((f) => f.id === 'face-1-1')!;
const faceActivities = activities.filter((a) => a.faceId === face.id);

export const Default: Story = {
  args: { face, activities: faceActivities, users },
};

export const Empty: Story = {
  args: { face, activities: [], users },
};

export const OtherFace: Story = {
  args: {
    face: faces.find((f) => f.id === 'face-1-2') ?? face,
    activities: activities.filter((a) => a.faceId === 'face-1-2'),
    users,
  },
};
