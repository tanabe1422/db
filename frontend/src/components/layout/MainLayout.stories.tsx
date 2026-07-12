import type { Meta, StoryObj } from '@storybook/react-vite'

import { MainLayout } from './MainLayout'

const meta = {
  title: 'Layout/MainLayout',
  component: MainLayout,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof MainLayout>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    toolbar: (
      <div
        style={{
          padding: '0.5rem 1rem',
          borderBottom: '1px solid #e2e8f0',
          background: '#fff',
        }}
      >
        Toolbar
      </div>
    ),
    sidebar: (
      <div style={{ padding: '0.75rem', fontSize: '0.875rem' }}>Sidebar</div>
    ),
    children: (
      <div style={{ padding: '1rem' }}>
        <h2 style={{ margin: '0 0 0.5rem' }}>Workspace</h2>
        <p style={{ margin: 0, color: '#64748b' }}>メインコンテンツ領域</p>
      </div>
    ),
  },
}
