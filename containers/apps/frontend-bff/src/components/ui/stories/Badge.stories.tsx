import type { Meta, StoryObj } from '@storybook/react';
import Badge from '../Badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    emoji: '🎯',
  },
};

export const Star: Story = {
  args: {
    emoji: '⭐',
  },
};

export const Fire: Story = {
  args: {
    emoji: '🔥',
  },
};
