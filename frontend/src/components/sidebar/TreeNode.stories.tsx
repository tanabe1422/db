import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import type { TreeNode as TreeNodeType } from '../../types'

import { TreeNode } from './TreeNode'

const sampleTree: TreeNodeType = {
  name: 'db',
  path: 'C:\\project\\src\\db',
  isDir: true,
  children: [
    {
      name: 'users.table.json',
      path: 'C:\\project\\src\\db\\users.table.json',
      isDir: false,
      children: [],
    },
    {
      name: 'seed.sql',
      path: 'C:\\project\\src\\db\\seed.sql',
      isDir: false,
      children: [],
    },
    {
      name: 'nested',
      path: 'C:\\project\\src\\db\\nested',
      isDir: true,
      children: [
        {
          name: 'orders.table.json',
          path: 'C:\\project\\src\\db\\nested\\orders.table.json',
          isDir: false,
          children: [],
        },
      ],
    },
  ],
}

const meta = {
  title: 'Sidebar/TreeNode',
  component: TreeNode,
  parameters: {
    layout: 'padded',
  },
  args: {
    node: sampleTree,
    rootDirectory: 'C:\\project',
    onSelect: () => undefined,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: 280,
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TreeNode>

export default meta
type Story = StoryObj<typeof meta>

export const FolderTree: Story = {}

export const WithSelection: Story = {
  render: function WithSelectionStory(args) {
    const [selectedPath, setSelectedPath] = useState(
      'C:\\project\\src\\db\\users.table.json',
    )
    return (
      <TreeNode
        {...args}
        selectedPath={selectedPath}
        onSelect={setSelectedPath}
      />
    )
  },
}
