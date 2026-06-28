import type { Meta, StoryObj } from '@storybook/react-vite'
import { TableDefinitionView } from './TableDefinitionView'
import { mockTableDefinition } from '../../mocks/data'

const meta = {
  title: 'Table/TableDefinitionView',
  component: TableDefinitionView,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof TableDefinitionView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    definition: mockTableDefinition,
    path: 'C:\\project\\src\\db\\users.table.json',
  },
}

export const Minimal: Story = {
  args: {
    definition: {
      schemaVersion: 1,
      name: 'tags',
      columns: [{ name: 'id', dataType: 'int', notNull: true }],
    },
    path: 'C:\\project\\src\\db\\tags.table.json',
  },
}
