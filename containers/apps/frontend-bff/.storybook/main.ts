import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  async viteFinal(config) {
    const { mergeConfig } = await import('vite');
    return mergeConfig(config, {
      resolve: {
        alias: [
          // Server Actions をモック化（より具体的なパスを先に置く必要がある）
          {
            find: '@/server/actions/faces',
            replacement: path.resolve(__dirname, 'mocks/server-actions.ts'),
          },
          {
            find: '@/server/actions/auth',
            replacement: path.resolve(__dirname, 'mocks/auth-actions.ts'),
          },
          // Next.js / Node.js サーバー専用モジュールをスタブ化
          { find: 'server-only', replacement: path.resolve(__dirname, 'mocks/server-only.ts') },
          // Next.js 固有モジュールをモック化
          { find: 'next/image', replacement: path.resolve(__dirname, 'mocks/next-image.tsx') },
          { find: 'next/link', replacement: path.resolve(__dirname, 'mocks/next-link.tsx') },
          {
            find: 'next/navigation',
            replacement: path.resolve(__dirname, 'mocks/next-navigation.ts'),
          },
          // パスエイリアス（@ が他のエイリアスを上書きしないよう最後に置く）
          { find: '@', replacement: path.resolve(__dirname, '../src') },
        ],
      },
    });
  },
};

export default config;
