import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import SearchScopeSelector from '../SearchScopeSelector';

const meta: Meta<typeof SearchScopeSelector> = {
  title: 'Search/SearchScopeSelector',
  component: SearchScopeSelector,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SearchScopeSelector>;

export const All: Story = {
  args: { scope: 'all', onScopeChange: fn() },
};

export const Mine: Story = {
  args: { scope: 'mine', onScopeChange: fn() },
};

export const Subscribed: Story = {
  args: { scope: 'subscribed', onScopeChange: fn() },
};
