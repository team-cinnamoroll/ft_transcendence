import type { Meta, StoryObj } from '@storybook/react';
import LanguageSwitcher from '../LanguageSwitcher';

const meta: Meta<typeof LanguageSwitcher> = {
  title: 'Settings/LanguageSwitcher',
  component: LanguageSwitcher,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LanguageSwitcher>;

export const Default: Story = {};
