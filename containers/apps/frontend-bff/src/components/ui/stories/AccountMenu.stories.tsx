import type { Meta, StoryObj } from '@storybook/react';
import AccountMenu from '../AccountMenu';

const mockUser = {
  id: 'user-1',
  name: '山田 太郎',
  avatar: {
    id: 'avatar-1',
    url: 'https://i.pravatar.cc/150?u=user-1',
  },
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
    seedCount: 42,
    isOpen: true,
    isAuthenticated: true,
    onClose: () => {},
  },
};

export const Closed: Story = {
  args: {
    user: mockUser,
    faceCount: 5,
    seedCount: 42,
    isOpen: false,
    isAuthenticated: true,
    onClose: () => {},
  },
};

export const LoggedOut: Story = {
  args: {
    user: mockUser,
    faceCount: 5,
    seedCount: 42,
    isOpen: true,
    isAuthenticated: false,
    onClose: () => {},
  },
};
