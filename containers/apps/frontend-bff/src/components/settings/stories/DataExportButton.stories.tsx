import type { Meta, StoryObj } from '@storybook/react';
import DataExportButton from '../DataExportButton';

const meta: Meta<typeof DataExportButton> = {
  title: 'Settings/DataExportButton',
  component: DataExportButton,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof DataExportButton>;

export const Default: Story = {};
