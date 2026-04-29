import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import FAB from '../FAB';
import { currentUser } from '@/mocks/users';
import { faces } from '@/mocks/faces';

// FAB は md:hidden のため、強制表示用スタイルを注入
const FAB_OVERRIDE_STYLE = `
  /* Storybook: FAB の md:hidden / position:fixed を上書き */
  .storybook-fab-wrapper button[aria-label="投稿する"] {
    display: flex !important;
    position: static !important;
  }
`;

const meta: Meta<typeof FAB> = {
  title: 'UI/FAB',
  component: FAB,
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      const [originalFetch] = React.useState<typeof window.fetch>(() => window.fetch);

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
      }, [originalFetch]);

      return (
        <>
          <style>{FAB_OVERRIDE_STYLE}</style>
          <div
            className="storybook-fab-wrapper"
            style={{
              position: 'relative',
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              padding: '1rem',
            }}
          >
            <Story />
          </div>
        </>
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
