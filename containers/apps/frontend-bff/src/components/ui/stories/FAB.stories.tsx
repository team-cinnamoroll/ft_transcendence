import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import FAB from '../FAB';
import { currentUser } from '@/mocks/users';
import { faces } from '@/mocks/faces';

// モジュールロード時点（モック適用前）の fetch を保存する
const originalFetch = window.fetch;

const meta: Meta<typeof FAB> = {
  title: 'UI/FAB',
  component: FAB,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile' },
    docs: {
      story: {
        inline: false,
        iframeHeight: 700,
      },
    },
  },
  decorators: [
    (Story) => {
      // fetch モック: PostModal が /api/viewer を呼ぶため（Story 初回レンダリング前に設定）
      window.fetch = fn().mockResolvedValue({
        ok: true,
        json: async () => ({ currentUser, myFaces: faces.filter((f) => f.userId === 'user-1') }),
      } as unknown as Response);

      // アンマウント時に元の fetch を復元し、他ストーリーへの副作用を防ぐ
      React.useEffect(() => {
        return () => {
          window.fetch = originalFetch;
        };
      }, []);

      return (
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
            // fixed要素（BottomNavなど）をこの枠内に閉じ込める指定
            transform: 'translateZ(0)',
          }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof FAB>;

export const Default: Story = {};

export const WithDefaultFace: Story = {
  args: {
    defaultFaceId: 'face-1-1',
  },
};
