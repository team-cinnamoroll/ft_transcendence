import type { Meta, StoryObj } from '@storybook/react';
import SubscriptionSeed from '../SubscriptionSeed';
import { users } from '@/mocks/users';
import { faces } from '@/mocks/faces';
import { seeds } from '@/mocks/seeds';
import { subscribedFaceIds } from '@/mocks/subscriptions';

const meta: Meta<typeof SubscriptionSeed> = {
  title: 'Subscriptions/SubscriptionSeed',
  component: SubscriptionSeed,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SubscriptionSeed>;

const subscribedSeeds = seeds.filter((s) => subscribedFaceIds.includes(s.faceId));

export const Default: Story = {
  args: { subscribedFaceIds, subscribedSeeds, faces, users },
};

export const Empty: Story = {
  args: { subscribedFaceIds, subscribedSeeds: [], faces, users },
};
