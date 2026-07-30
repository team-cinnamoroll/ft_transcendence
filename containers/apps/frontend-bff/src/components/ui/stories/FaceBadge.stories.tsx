import type { Meta, StoryObj } from '@storybook/react';
import FaceBadge from '../FaceBadge';

const mockFace = {
  id: 'face-1',
  userId: 'user-1',
  name: '読書',
  emoji: '📚',
  visibility: 'public' as const,
  description: '読書に関する記録',
  image: null,
};

const mockFaceWithImage = {
  id: 'face-2',
  userId: 'user-1',
  name: '旅行',
  emoji: '✈️',
  image: { id: 'image1', url: 'https://picsum.photos/seed/face/100' },
  visibility: 'public' as const,
  description: '旅行に関する記録',
};

const meta: Meta<typeof FaceBadge> = {
  title: 'UI/FaceBadge',
  component: FaceBadge,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof FaceBadge>;

export const Default: Story = {
  args: { face: mockFace },
};

export const Large: Story = {
  args: { face: mockFace, size: 56, radius: 14 },
};

export const Small: Story = {
  args: { face: mockFace, size: 24, radius: 6 },
};

export const WithImage: Story = {
  args: { face: mockFaceWithImage },
};
