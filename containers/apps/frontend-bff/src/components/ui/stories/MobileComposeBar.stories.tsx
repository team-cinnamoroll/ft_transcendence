import type { Meta, StoryObj } from '@storybook/react';
import MobileComposeBar from '../MobileComposeBar';

const mockFace = {
  id: 'face-1',
  userId: 'user-1',
  name: '読書',
  emoji: '📚',
  visibility: 'public' as const,
  description: '読書に関する記録',
  image: null,
};

const meta: Meta<typeof MobileComposeBar> = {
  title: 'UI/MobileComposeBar',
  component: MobileComposeBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile' },
  },
};

export default meta;
type Story = StoryObj<typeof MobileComposeBar>;

export const WithFace: Story = {
  args: { defaultFace: mockFace },
};

export const NoFace: Story = {
  args: { defaultFace: undefined },
};
