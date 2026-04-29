import type { Meta, StoryObj } from '@storybook/react';
import FaceHeader from '../FaceHeader';
import { faces } from '@/mocks/faces';

const meta: Meta<typeof FaceHeader> = {
  title: 'Face/FaceHeader',
  component: FaceHeader,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof FaceHeader>;

const face = faces.find((f) => f.id === 'face-1-1')!;
const faceWithImage = faces.find((f) => f.imageUrl) ?? face;

export const Default: Story = {
  args: { face },
};

export const AsOwner: Story = {
  args: { face, isOwner: true },
};

export const WithImage: Story = {
  args: { face: faceWithImage, isOwner: false },
};

export const PrivateFace: Story = {
  args: {
    face: faces.find((f) => f.isPrivate) ?? { ...face, isPrivate: true, name: '非公開フェイス' },
    isOwner: true,
  },
};
