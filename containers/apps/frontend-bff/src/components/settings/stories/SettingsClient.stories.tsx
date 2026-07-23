import type { Meta, StoryObj } from '@storybook/react';
import SettingsClient from '../SettingsClient';

const mockUser = {
  id: 'user-1',
  name: '山田 太郎',
  avatar: {
    id: 'avatar-1',
    url: 'https://i.pravatar.cc/150?u=user-1',
  },
  badge: '🌟',
};

const meta: Meta<typeof SettingsClient> = {
  title: 'Settings/SettingsClient',
  component: SettingsClient,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof SettingsClient>;

export const Default: Story = {
  args: {
    user: mockUser,
    faceCount: 5,
    seedCount: 42,
  },
};
