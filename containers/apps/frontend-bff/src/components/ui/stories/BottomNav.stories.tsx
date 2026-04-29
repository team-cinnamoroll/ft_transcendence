import type { Meta, StoryObj } from '@storybook/react';
import BottomNav from '../BottomNav';

const meta: Meta<typeof BottomNav> = {
  title: 'UI/BottomNav',
  component: BottomNav,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ height: '80px', position: 'relative' }}>
        {/*
         * BottomNav は md:hidden（768px以上で非表示）かつ position:fixed のため、
         * Storybook 上では強制的に表示するよう CSS を上書きしている。
         * アプリ本体のコードは変更していない。
         */}
        <style>{`
          .storybook-wrapper nav {
            display: flex !important;
            position: static !important;
          }
        `}</style>
        <div className="storybook-wrapper">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BottomNav>;

export const Default: Story = {};
