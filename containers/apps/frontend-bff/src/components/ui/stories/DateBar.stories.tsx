import type { Meta, StoryObj } from '@storybook/react';
import DateBar from '../DateBar';

const meta: Meta<typeof DateBar> = {
  title: 'UI/DateBar',
  component: DateBar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DateBar>;

export const Default: Story = {
  args: {
    label: '2026年3月',
    date: '2026.03',
  },
};

export const Today: Story = {
  args: {
    label: '今日',
    date: '2026.06.05',
  },
};
