import type { Meta, StoryObj } from '@storybook/react';
import SideNav from '../SideNav';
import { faces } from '@/mocks/faces';
import { currentUser } from '@/mocks/users';
import { seeds } from '@/mocks/seeds';
import { USER_IDS } from '@/mocks/ids';

const meta: Meta<typeof SideNav> = {
  title: 'UI/SideNav',
  component: SideNav,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'pc' },
  },
  args: {
    user: currentUser,
    faceCount: faces.filter((f) => f.userId === USER_IDS.user1).length,
    seedCount: seeds.filter((s) => s.userId === USER_IDS.user1).length,
    isAuthenticated: true,
  },
};

export default meta;
type Story = StoryObj<typeof SideNav>;

const wrapperStyle: React.CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <div style={wrapperStyle}>{children}</div>
);

export const Default: Story = {
  args: {
    faces: faces.filter((f) => f.userId === USER_IDS.user1),
  },
  decorators: [
    (Story) => (
      <Wrapper>
        <Story />
      </Wrapper>
    ),
  ],
};

export const ManyFaces: Story = {
  args: {
    faces,
  },
  decorators: Default.decorators,
};

export const NoFaces: Story = {
  args: {
    faces: [],
  },
  decorators: Default.decorators,
};
