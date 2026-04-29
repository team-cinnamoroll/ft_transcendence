import type { Meta, StoryObj } from '@storybook/react';
import SearchResults from '../SearchResults';
import { users } from '@/mocks/users';
import { faces } from '@/mocks/faces';
import { activities } from '@/mocks/activities';
import { subscribedFaceIds } from '@/mocks/subscriptions';
import type { SearchActivityResultItem } from '../SearchResults';

const meta: Meta<typeof SearchResults> = {
  title: 'Search/SearchResults',
  component: SearchResults,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SearchResults>;

// SearchActivityResultItem のビルド
const activityResults: SearchActivityResultItem[] = activities
  .filter((a) => a.body.includes('読書') || a.body.includes('本'))
  .slice(0, 5)
  .map((activity) => {
    const user = users.find((u) => u.id === activity.userId) ?? users[0]!;
    const face = faces.find((f) => f.id === activity.faceId) ?? faces[0]!;
    return { activity, user, face };
  });

const faceResults = faces.filter((f) => f.name.includes('読書'));

export const WithResults: Story = {
  args: {
    query: '読書',
    activityResults,
    faceResults,
    subscribedFaceIds,
  },
};

export const NoResults: Story = {
  args: {
    query: '存在しない検索ワード',
    activityResults: [],
    faceResults: [],
    subscribedFaceIds,
  },
};

export const EmptyQuery: Story = {
  args: {
    query: '',
    activityResults: [],
    faceResults: [],
    subscribedFaceIds,
  },
};
