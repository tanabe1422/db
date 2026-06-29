import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { mockTree } from '../../mocks/data'
import type { TreeNode } from '../../types'

import { CollapsibleSidebar, SidebarProvider } from '../layout/CollapsibleSidebar'
import { SidebarPanelLayout } from '../sidebar/SidebarPanelLayout'
import { DiffSetupPanel } from './DiffSetupPanel'

const meta = {
  title: 'Diff/DiffSetupPanel',
  component: DiffSetupPanel,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <SidebarProvider>
        <div style={{ height: '100vh', display: 'flex' }}>
          <CollapsibleSidebar>
          <SidebarPanelLayout
            mode="diff"
            activeDirectory="C:\\project"
            onManageDirectories={() => undefined}
            onRescan={() => undefined}
            onModeChange={() => undefined}
          >
            <Story />
          </SidebarPanelLayout>
        </CollapsibleSidebar>
        </div>
      </SidebarProvider>
    ),
  ],
  args: {
    onSelectLeft: () => undefined,
    onSelectRight: () => undefined,
  },
} satisfies Meta<typeof DiffSetupPanel>

export default meta
type Story = StoryObj<typeof meta>

export const NoDirectory: Story = {
  args: {
    activeDirectory: '',
    tree: null,
  },
  decorators: [
    (Story) => (
      <SidebarProvider>
        <div style={{ height: '100vh', display: 'flex' }}>
          <CollapsibleSidebar>
          <SidebarPanelLayout
            mode="diff"
            activeDirectory=""
            onManageDirectories={() => undefined}
            onRescan={() => undefined}
            onModeChange={() => undefined}
          >
            <Story />
          </SidebarPanelLayout>
        </CollapsibleSidebar>
        </div>
      </SidebarProvider>
    ),
  ],
}

export const WithTree: Story = {
  args: {
    activeDirectory: 'C:\\project',
    tree: mockTree,
  },
}

export const WithSelection: Story = {
  args: {
    activeDirectory: 'C:\\project',
    tree: mockTree,
    leftPath: 'C:\\project\\src',
    rightPath: 'C:\\project\\src\\db',
  },
}

function InteractivePanel() {
  const [left, setLeft] = useState<TreeNode | null>(null)
  const [right, setRight] = useState<TreeNode | null>(null)

  return (
    <DiffSetupPanel
      activeDirectory="C:\\project"
      tree={mockTree}
      leftPath={left?.path}
      rightPath={right?.path}
      onSelectLeft={setLeft}
      onSelectRight={setRight}
    />
  )
}

export const Interactive: Story = {
  args: {
    activeDirectory: 'C:\\project',
    tree: mockTree,
  },
  render: () => <InteractivePanel />,
}
