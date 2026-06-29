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

const paths = [
  'C:\\project\\src\\db\\users.table.json',
  'C:\\project\\src\\db\\orders.table.json',
  'C:\\project\\src\\db\\order_items.table.json',
]

export const Single: Story = {
  args: {
    paths: [paths[0]],
    activePath: paths[0],
    dirtyPaths: new Set(),
  },
}

export const Multiple: Story = {
  args: {
    paths,
    activePath: paths[1],
    dirtyPaths: new Set(),
  },
}

export const WithDirty: Story = {
  args: {
    paths,
    activePath: paths[0],
    dirtyPaths: new Set([paths[0], paths[2]]),
  },
}
