import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
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

export const ValidationErrors: Story = {
  args: {
    definition: {
      schemaVersion: 1,
      name: 'broken',
      columns: [{ name: 'id', dataType: 'int', notNull: true }],
    },
    path: 'C:\\project\\src\\db\\broken.table.json',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()
    // 空名カラムを追加して dirty + 検証 NG にし、保存でエラー表示を出す
    await user.click(await canvas.findByLabelText('下に新しい行を追加'))
    await user.click(canvas.getByRole('button', { name: /保存/ }))
    await expect(canvas.getByText(/検証エラー/)).toBeInTheDocument()
  },
}
