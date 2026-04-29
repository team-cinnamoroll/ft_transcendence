import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import CreateFaceModal from '../CreateFaceModal';

const meta: Meta<typeof CreateFaceModal> = {
  title: 'Face/CreateFaceModal',
  component: CreateFaceModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof CreateFaceModal>;

export const Open: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
    onCreate: fn(),
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: fn(),
    onCreate: fn(),
  },
};
