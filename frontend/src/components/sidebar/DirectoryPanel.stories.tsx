import type { Meta, StoryObj } from '@storybook/react-vite'
import { CollapsibleSidebar, SidebarProvider } from '../layout/CollapsibleSidebar'
import { DirectoryPanel } from './DirectoryPanel'
import { SidebarPanelLayout } from './SidebarPanelLayout'
import { mockTree } from '../../mocks/data'

const meta = {
  title: 'Sidebar/DirectoryPanel',
  component: DirectoryPanel,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <SidebarProvider>
        <div style={{ height: '100vh', display: 'flex' }}>
          <CollapsibleSidebar>
          <SidebarPanelLayout
            mode="edit"
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
    onRescan: () => undefined,
  },
} satisfies Meta<typeof DirectoryPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    activeDirectory: '',
    tree: null,
    loading: false,
    error: null,
    selectedPath: "ああああああああああああああああああああああああああああああああああああああああああああああああああ"
  },
  decorators: [
    (Story) => (
      <SidebarProvider>
        <div style={{ height: '100vh', display: 'flex' }}>
          <CollapsibleSidebar>
          <SidebarPanelLayout
            mode="edit"
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

export const Loading: Story = {
  args: {
    activeDirectory: 'C:\\project',
    tree: null,
    loading: true,
    error: null,
    selectedPath: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\naaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  },
}

export const WithTree: Story = {
  args: {
    activeDirectory: 'C:\\project',
    tree: mockTree,
    loading: false,
    error: null,
    selectedPath: 'C:\\project\\src\\db\\users.table.json',
  },
}

export const LongPath: Story = {
  args: {
    activeDirectory:
      'C:\\Users\\tanabe\\Documents\\very-long-folder-name\\projects\\db-gui',
    tree: mockTree,
    loading: false,
    error: null,
  },
}

export const NoMatches: Story = {
  args: {
    activeDirectory: 'C:\\project',
    tree: { name: 'project', path: '', isDir: true, children: [] },
    loading: false,
    error: null,
  },
}
