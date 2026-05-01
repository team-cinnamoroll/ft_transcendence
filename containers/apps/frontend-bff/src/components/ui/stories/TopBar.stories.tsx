import type { Meta, StoryObj } from '@storybook/react';
import TopBar from '../TopBar';

const meta: Meta<typeof TopBar> = {
  title: 'UI/TopBar',
  component: TopBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    // hidden md:flex のため desktop サイズで表示する（デフォルトのまま）
  },
};

export default meta;
type Story = StoryObj<typeof TopBar>;

// usePathname のモックは常に '/' を返すため、タイトルは「ホーム」で固定
export const Default: Story = {};

export const CustomTitle: Story = {
  args: {
    pageTitle: 'カスタムタイトル',
  },
};
