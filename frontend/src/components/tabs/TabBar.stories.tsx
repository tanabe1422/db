import type { Meta, StoryObj } from '@storybook/react-vite'
import { TabBar } from './TabBar'

const meta = {
  title: 'Tabs/TabBar',
  component: TabBar,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    activeDirectory: 'C:\\project',
    onActivate: () => undefined,
    onClose: () => undefined,
    onCloseAllSaved: () => undefined,
  },
} satisfies Meta<typeof TabBar>

export default meta
type Story = StoryObj<typeof meta>

const fileTabs = [
  {
    kind: 'file' as const,
    id: 'C:\\project\\src\\db\\users.table.json',
    path: 'C:\\project\\src\\db\\users.table.json',
  },
  {
    kind: 'file' as const,
    id: 'C:\\project\\src\\db\\orders.table.json',
    path: 'C:\\project\\src\\db\\orders.table.json',
  },
  {
    kind: 'file' as const,
    id: 'C:\\project\\src\\db\\order_items.table.json',
    path: 'C:\\project\\src\\db\\order_items.table.json',
  },
]

export const Single: Story = {
  args: {
    tabs: [fileTabs[0]],
    activeTabId: fileTabs[0].id,
    dirtyPaths: new Set(),
  },
}

export const Multiple: Story = {
  args: {
    tabs: fileTabs,
    activeTabId: fileTabs[1].id,
    dirtyPaths: new Set(),
  },
}

export const WithDirty: Story = {
  args: {
    tabs: [
      ...fileTabs,
      {
        kind: 'diff',
        id: 'diff-preview:1',
        label: 'users.table.json (diff)',
        relPath: 'users.table.json',
        source: {
          type: 'inline',
          leftJson: '{"tableName":"users"}',
          rightJson: '{"tableName":"users","columns":[]}',
        },
      },
    ],
    activeTabId: fileTabs[0].id,
    dirtyPaths: new Set([fileTabs[0].path, fileTabs[2].path]),
  },
}
