import type { Meta, StoryObj } from '@storybook/react';
import AccountMenu from '../AccountMenu';

const mockUser = {
  id: 'user-1',
  name: '山田 太郎',
  avatarUrl: 'https://i.pravatar.cc/150?u=user-1',
  badge: '🌟',
};

const meta: Meta<typeof AccountMenu> = {
  title: 'UI/AccountMenu',
  component: AccountMenu,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof AccountMenu>;

export const Open: Story = {
  args: {
    user: mockUser,
    faceCount: 5,
    activityCount: 42,
    isOpen: true,
    onClose: () => {},
  },
};

export const Closed: Story = {
  args: {
    user: mockUser,
    faceCount: 5,
    activityCount: 42,
    isOpen: false,
    onClose: () => {},
  },
};
