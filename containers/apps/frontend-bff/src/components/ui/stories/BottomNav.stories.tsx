import type { Meta, StoryObj } from '@storybook/react';
import BottomNav from '../BottomNav';

const meta: Meta<typeof BottomNav> = {
  title: 'UI/BottomNav',
  component: BottomNav,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile' },
    docs: {
      story: {
        inline: false,
        iframeHeight: 700, // 高さを少し広げて全体の端末枠が表示されるように
      },
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: '375px',
          height: '667px',
          position: 'relative',
          margin: '0 auto',
          border: '1px solid #3f3f46',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: '#18181b', // ダークモードの背景色に近い色
          // fixed要素をこの枠内に閉じ込めるための指定
          transform: 'translateZ(0)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BottomNav>;

export const Default: Story = {};
