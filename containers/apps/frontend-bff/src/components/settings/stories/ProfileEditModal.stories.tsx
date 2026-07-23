import type { Meta, StoryObj } from '@storybook/react';
import ProfileEditModal from '../ProfileEditModal';

const mockUser = {
  id: 'user-1',
  name: '山田 太郎',
  avatar: {
    id: 'avatar-1',
    url: 'https://i.pravatar.cc/150?u=user-1',
  },
  badge: '🌟',
};

const meta: Meta<typeof ProfileEditModal> = {
  title: 'Settings/ProfileEditModal',
  component: ProfileEditModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof ProfileEditModal>;

export const Default: Story = {
  args: {
    user: mockUser,
    onClose: () => {},
  },
};

export const WithoutBadge: Story = {
  args: {
    user: { ...mockUser, badge: null },
    onClose: () => {},
  },
};
