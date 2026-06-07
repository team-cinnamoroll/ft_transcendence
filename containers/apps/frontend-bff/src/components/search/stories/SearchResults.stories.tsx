import type { Meta, StoryObj } from '@storybook/react';
import SearchResults from '../SearchResults';
import { users } from '@/mocks/users';
import { faces } from '@/mocks/faces';
import { seeds } from '@/mocks/seeds';
import { subscribedFaceIds } from '@/mocks/subscriptions';
import type { SearchSeedResultItem } from '../SearchResults';

const meta: Meta<typeof SearchResults> = {
  title: 'Search/SearchResults',
  component: SearchResults,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SearchResults>;

const seedResults: SearchSeedResultItem[] = seeds
  .filter((s) => s.body.includes('読書') || s.body.includes('本'))
  .slice(0, 5)
  .map((seed) => {
    const user = users.find((u) => u.id === seed.userId) ?? users[0]!;
    const face = faces.find((f) => f.id === seed.faceId) ?? faces[0]!;
    return { seed, user, face };
  });

const faceResults = faces.filter((f) => f.name.includes('読書'));

export const WithResults: Story = {
  args: {
    query: '読書',
    seedResults,
    faceResults,
    subscribedFaceIds,
  },
};

export const NoResults: Story = {
  args: {
    query: '存在しない検索ワード',
    seedResults: [],
    faceResults: [],
    subscribedFaceIds,
  },
};

export const EmptyQuery: Story = {
  args: {
    query: '',
    seedResults: [],
    faceResults: [],
    subscribedFaceIds,
  },
};
