import type { Meta, StoryObj } from '@storybook/react';
import Avatar from '../Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

const PLACEHOLDER = 'https://i.pravatar.cc/150?img=1';

export const Small: Story = {
  args: {
    src: PLACEHOLDER,
    alt: 'ユーザーアバター',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    src: PLACEHOLDER,
    alt: 'ユーザーアバター',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    src: PLACEHOLDER,
    alt: 'ユーザーアバター',
    size: 'lg',
  },
};
