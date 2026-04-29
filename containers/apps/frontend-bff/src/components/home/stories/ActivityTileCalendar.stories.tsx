import type { Meta, StoryObj } from '@storybook/react';
import ActivityTileCalendar from '../ActivityTileCalendar';
import { activities } from '@/mocks/activities';

const meta: Meta<typeof ActivityTileCalendar> = {
  title: 'Home/ActivityTileCalendar',
  component: ActivityTileCalendar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ActivityTileCalendar>;

export const Default: Story = {
  args: { activities },
};

export const Empty: Story = {
  args: { activities: [] },
};
