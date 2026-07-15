import type { Meta, StoryObj } from '@storybook/react';
import AdminClient from '../AdminClient';

const mockUsers = [
  { id: 'user-1', name: '山田 太郎', avatarUrl: 'https://i.pravatar.cc/150?u=user-1', badge: '🌟' },
  { id: 'user-2', name: '佐藤 花子', avatarUrl: 'https://i.pravatar.cc/150?u=user-2', badge: '📚' },
  { id: 'user-3', name: '鈴木 一郎', avatarUrl: 'https://i.pravatar.cc/150?u=user-3', badge: '🎮' },
];

const meta: Meta<typeof AdminClient> = {
  title: 'Admin/AdminClient',
  component: AdminClient,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof AdminClient>;

export const Default: Story = {
  args: {
    users: mockUsers,
    faceCount: 12,
    activityCount: 87,
  },
};

export const Empty: Story = {
  args: {
    users: [],
    faceCount: 0,
    activityCount: 0,
  },
};
