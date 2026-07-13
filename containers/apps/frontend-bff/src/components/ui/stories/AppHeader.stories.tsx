import type { Meta, StoryObj } from '@storybook/react';
import AppHeader from '../AppHeader';

const mockUser = {
  id: 'user-1',
  name: '山田 太郎',
  avatarUrl: 'https://i.pravatar.cc/150?u=user-1',
  badge: '🌟',
};

const meta: Meta<typeof AppHeader> = {
  title: 'UI/AppHeader',
  component: AppHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile' },
  },
};

export default meta;
type Story = StoryObj<typeof AppHeader>;

export const Default: Story = {
  args: {
    user: mockUser,
    faceCount: 5,
    seedCount: 42,
    unreadCount: 0,
    isAuthenticated: true,
  },
};

export const WithUnread: Story = {
  args: {
    user: mockUser,
    faceCount: 5,
    seedCount: 42,
    unreadCount: 3,
    isAuthenticated: true,
  },
};
