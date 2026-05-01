import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import FaceFilterBar from '../FaceFilterBar';
import { faces } from '@/mocks/faces';

const meta: Meta<typeof FaceFilterBar> = {
  title: 'Home/FaceFilterBar',
  component: FaceFilterBar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FaceFilterBar>;

const myFaces = faces.filter((f) => f.userId === 'user-1');

export const Default: Story = {
  args: { faces: myFaces, selectedFaceId: null, onSelect: fn() },
};

export const FaceSelected: Story = {
  args: { faces: myFaces, selectedFaceId: myFaces[0]?.id ?? null, onSelect: fn() },
};
