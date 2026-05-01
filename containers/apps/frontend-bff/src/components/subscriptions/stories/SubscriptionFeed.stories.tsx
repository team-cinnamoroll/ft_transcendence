import type { Meta, StoryObj } from '@storybook/react';
import SubscriptionFeed from '../SubscriptionFeed';
import { users } from '@/mocks/users';
import { faces } from '@/mocks/faces';
import { activities } from '@/mocks/activities';
import { subscribedFaceIds } from '@/mocks/subscriptions';

const meta: Meta<typeof SubscriptionFeed> = {
  title: 'Subscriptions/SubscriptionFeed',
  component: SubscriptionFeed,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SubscriptionFeed>;

const subscribedActivities = activities.filter((a) => subscribedFaceIds.includes(a.faceId));

export const Default: Story = {
  args: { subscribedFaceIds, subscribedActivities, faces, users },
};

export const Empty: Story = {
  args: { subscribedFaceIds, subscribedActivities: [], faces, users },
};
