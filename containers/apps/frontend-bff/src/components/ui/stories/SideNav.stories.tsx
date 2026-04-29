import type { Meta, StoryObj } from '@storybook/react';
import SideNav from '../SideNav';
import { faces } from '@/mocks/faces';

const meta: Meta<typeof SideNav> = {
  title: 'UI/SideNav',
  component: SideNav,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'pc' },
  },
};

export default meta;
type Story = StoryObj<typeof SideNav>;

// SideNav は md 以上でのみ表示される（md:flex）
const wrapperStyle: React.CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <div style={wrapperStyle}>{children}</div>
);

export const Default: Story = {
  args: {
    faces: faces.filter((f) => f.userId === 'user-1'),
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
