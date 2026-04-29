import type { Meta, StoryObj } from '@storybook/react';
import FaceChip from '../FaceChip';

const meta: Meta<typeof FaceChip> = {
  title: 'UI/FaceChip',
  component: FaceChip,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof FaceChip>;

export const Violet: Story = {
  args: {
    title: '仕事',
    faceId: 'face-1',
  },
};

export const Sky: Story = {
  args: {
    title: 'プライベート',
    faceId: 'face-2',
  },
};

export const Emerald: Story = {
  args: {
    title: '趣味',
    faceId: 'face-3',
  },
};

export const LongTitle: Story = {
  args: {
    title: 'とても長いフェイス名前のテスト',
    faceId: 'face-4',
  },
};
