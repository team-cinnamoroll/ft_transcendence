import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import PostModal from '../PostModal';
import { currentUser } from '@/mocks/users';
import { faces } from '@/mocks/faces';
import { USER_IDS, FACE_IDS } from '@/mocks/ids';

const myFaces = faces.filter((f) => f.userId === USER_IDS.user1);

// モジュールロード時点（モック適用前）の fetch を保存する
const originalFetch = window.fetch;

const meta: Meta<typeof PostModal> = {
  title: 'UI/PostModal',
  component: PostModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: {
        inline: false,
        iframeHeight: 600,
      },
    },
  },
  decorators: [
    (Story) => {
      // /api/viewer モック（Story 初回レンダリング前に設定）
      window.fetch = fn().mockResolvedValue({
        ok: true,
        json: async () => ({ currentUser, myFaces }),
      } as unknown as Response);

      // アンマウント時に元の fetch を復元し、他ストーリーへの副作用を防ぐ
      React.useEffect(() => {
        return () => {
          window.fetch = originalFetch;
        };
      }, []);

      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof PostModal>;

export const Open: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
  },
};

export const OpenWithDefaultFace: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
    defaultFaceId: FACE_IDS.face11,
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: fn(),
  },
};
