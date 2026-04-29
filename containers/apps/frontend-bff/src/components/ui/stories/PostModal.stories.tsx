import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import PostModal from '../PostModal';
import { currentUser } from '@/mocks/users';
import { faces } from '@/mocks/faces';

const myFaces = faces.filter((f) => f.userId === 'user-1');

const meta: Meta<typeof PostModal> = {
  title: 'UI/PostModal',
  component: PostModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => {
      // /api/viewer モック
      window.fetch = fn().mockResolvedValue({
        ok: true,
        json: async () => ({ currentUser, myFaces }),
      } as unknown as Response);

      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof PostModal>;

export const Open: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
  },
};

export const OpenWithDefaultFace: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
    defaultFaceId: 'face-1-1',
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: fn(),
  },
};
