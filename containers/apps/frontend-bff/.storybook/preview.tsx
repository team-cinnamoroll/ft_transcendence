import React from 'react';
import type { Preview, Decorator } from '@storybook/react';
import '../src/app/globals.css';
import { DetailPanelProvider } from '../src/lib/detail-panel-context';

// ─── グローバルデコレーター ──────────────────────────────────
// useDetailPanel() を使うコンポーネントが全ストーリーで動作するよう
// DetailPanelProvider で囲む。
const withDetailPanel: Decorator = (Story) => (
  <DetailPanelProvider>
    <Story />
  </DetailPanelProvider>
);

const preview: Preview = {
  decorators: [withDetailPanel],
  parameters: {
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
