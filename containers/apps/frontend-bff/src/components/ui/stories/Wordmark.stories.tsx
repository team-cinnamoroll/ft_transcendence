import type { Meta, StoryObj } from '@storybook/react';
import Wordmark from '../Wordmark';

const meta: Meta<typeof Wordmark> = {
  title: 'UI/Wordmark',
  component: Wordmark,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof Wordmark>;

export const Default: Story = {};

export const Large: Story = {
  args: { size: 28 },
};

export const WithoutDot: Story = {
  args: { withDot: false },
};

export const CustomColor: Story = {
  args: { color: 'var(--mf-accent)', size: 22 },
};
