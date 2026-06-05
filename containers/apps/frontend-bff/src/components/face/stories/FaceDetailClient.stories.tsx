import type { Meta, StoryObj } from '@storybook/react';
import FaceDetailClient from '../FaceDetailClient';
import { faces } from '@/mocks/faces';
import { activities } from '@/mocks/activities';
import { users } from '@/mocks/users';

const face = faces.find((f) => f.id === 'face-1-1')!;
const faceActivities = activities.filter((a) => a.faceId === face.id);

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
    activities: faceActivities,
    users,
  },
};

export const AsVisitor: Story = {
  args: {
    face,
    isOwner: false,
    activities: faceActivities,
    users,
  },
};
