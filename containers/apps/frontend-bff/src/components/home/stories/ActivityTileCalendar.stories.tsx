import type { Meta, StoryObj } from '@storybook/react';
import SeedTileCalendar from '../SeedTileCalendar';
import { seeds } from '@/mocks/seeds';

const meta: Meta<typeof SeedTileCalendar> = {
  title: 'Home/SeedTileCalendar',
  component: SeedTileCalendar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SeedTileCalendar>;

export const Default: Story = {
  args: { seeds, today: new Date() },
};

export const Empty: Story = {
  args: { seeds: [], today: new Date() },
};
