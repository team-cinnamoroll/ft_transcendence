import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import SearchBar from '../SearchBar';

const meta: Meta<typeof SearchBar> = {
  title: 'Search/SearchBar',
  component: SearchBar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SearchBar>;

export const Empty: Story = {
  args: { value: '', onChange: fn() },
};

export const WithQuery: Story = {
  args: { value: '読書', onChange: fn() },
};
