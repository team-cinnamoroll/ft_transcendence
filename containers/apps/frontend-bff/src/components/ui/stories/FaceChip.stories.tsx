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

export const Small: Story = {
  args: {
    title: '仕事',
    faceId: 'face-1',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    title: '仕事',
    faceId: 'face-1',
    size: 'md',
  },
};

export const Water: Story = {
  args: {
    title: 'プライベート',
    faceId: 'face-2',
  },
};

export const Wisteria: Story = {
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
