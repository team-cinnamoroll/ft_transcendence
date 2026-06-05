import type { Meta, StoryObj } from '@storybook/react';
import FaceNavItem from '../FaceNavItem';
import type { Face } from '@/types/face';

const SAMPLE_FACE: Face = {
  id: 'face-1',
  userId: 'user-1',
  name: '仕事',
  emoji: '💼',
  description: '仕事に関する投稿',
  isPrivate: false,
};

const meta: Meta<typeof FaceNavItem> = {
  title: 'UI/FaceNavItem',
  component: FaceNavItem,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    face: SAMPLE_FACE,
    seedCount: 5,
  },
};

export default meta;
type Story = StoryObj<typeof FaceNavItem>;

export const Default: Story = {};

export const Active: Story = {
  args: {
    activeFaceId: 'face-1',
  },
};

export const WithoutCount: Story = {
  args: {
    seedCount: undefined,
  },
};

export const PrivateFace: Story = {
  args: {
    face: {
      ...SAMPLE_FACE,
      id: 'face-2',
      name: 'プライベート',
      emoji: '🔒',
      isPrivate: true,
    },
  },
};
