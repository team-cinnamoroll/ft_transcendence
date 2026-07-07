import type { Meta, StoryObj } from '@storybook/react';
import RailCard from '../RailCard';

const meta: Meta<typeof RailCard> = {
  title: 'UI/RailCard',
  component: RailCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ width: 300 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RailCard>;

export const WithTitle: Story = {
  args: {
    title: 'フェイスについて',
    children: (
      <p style={{ fontSize: 12.5, lineHeight: 1.75, color: 'var(--mf-text-sub)', margin: 0 }}>
        フェイスは「あなたの多面性」のひとつ。
      </p>
    ),
  },
};

export const WithTitleAndAction: Story = {
  args: {
    title: 'アクティビティ',
    action: '今月',
    children: (
      <p style={{ fontSize: 12, color: 'var(--mf-text-muted)', margin: 0 }}>
        今月はまだ記録がありません
      </p>
    ),
  },
};

export const NoTitle: Story = {
  args: {
    children: (
      <p style={{ fontSize: 12.5, color: 'var(--mf-text-sub)', margin: 0 }}>タイトルなしのカード</p>
    ),
  },
};
