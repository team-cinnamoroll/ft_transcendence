import React from 'react';
import type { Preview, Decorator } from '@storybook/react';
import '../src/app/globals.css';
import { DetailPanelProvider } from '../src/lib/detail-panel-context';
import { NextIntlClientProvider } from 'next-intl';
import ja from '../src/i18n/messages/ja.json';

// ─── グローバルデコレーター ──────────────────────────────────
// useDetailPanel() を使うコンポーネントが全ストーリーで動作するよう
// DetailPanelProvider で囲む。
const withDetailPanel: Decorator = (Story) => (
  <DetailPanelProvider>
    <Story />
  </DetailPanelProvider>
);

// next-intl の Provider をグローバルに適用する。
// locale は 'ja' 固定でよい（Storybook はロケール切り替えを想定しない）。
const withNextIntl: Decorator = (Story) => (
  <NextIntlClientProvider locale="ja" messages={ja}>
    <Story />
  </NextIntlClientProvider>
);

const customViewports = {
  mobile: {
    name: 'スマホ (Mobile)',
    styles: { width: '375px', height: '667px' },
  },
  pc: {
    name: 'PC (Desktop)',
    styles: { width: '1280px', height: '800px' },
  },
};

const preview: Preview = {
  decorators: [withNextIntl, withDetailPanel],
  parameters: {
    viewport: {
      viewports: customViewports,
      defaultViewport: 'mobile',
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#000000' },
        { name: 'light', value: '#ffffff' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
