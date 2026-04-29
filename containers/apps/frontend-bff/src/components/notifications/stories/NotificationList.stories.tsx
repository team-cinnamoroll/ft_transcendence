import type { Meta, StoryObj } from '@storybook/react';
import NotificationList from '../NotificationList';
import { notifications } from '@/mocks/notifications';
import { users } from '@/mocks/users';
import { faces } from '@/mocks/faces';
import { activities } from '@/mocks/activities';

const meta: Meta<typeof NotificationList> = {
  title: 'Notifications/NotificationList',
  component: NotificationList,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NotificationList>;

export const Default: Story = {
  args: { notifications, users, faces, activities },
};

export const Empty: Story = {
  args: { notifications: [], users, faces, activities },
};
