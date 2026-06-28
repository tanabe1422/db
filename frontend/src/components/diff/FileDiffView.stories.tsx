import type { Meta, StoryObj } from '@storybook/react-vite'
import { FileDiffView } from './FileDiffView'
import type { TableDefinition } from '../../types'
import { diffTable } from '../../lib/diffTable'
import { mockTableDefinition } from '../../mocks/data'

const meta = {
  title: 'Diff/FileDiffView',
  component: FileDiffView,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    relPath: 'src\\db\\users.table.json',
    onBack: () => undefined,
  },
} satisfies Meta<typeof FileDiffView>

export default meta
type Story = StoryObj<typeof meta>

const left = mockTableDefinition

// 右側: 型変更 / 列追加 / 列削除 / メタ変更を含む。
const right: TableDefinition = {
  ...mockTableDefinition,
  nameJa: 'ユーザー（改訂）',
  description: 'アプリ利用者マスタ（v2）',
  columns: [
    { name: 'id', nameJa: 'ID', dataType: 'int', notNull: true },
    {
      name: 'email',
      nameJa: 'メール',
      dataType: 'nvarchar',
      length: 320,
      notNull: true,
      unique: true,
    },
    { name: 'createdAt', nameJa: '作成日時', dataType: 'datetime2', notNull: true },
    { name: 'updatedAt', nameJa: '更新日時', dataType: 'datetime2', notNull: true },
  ],
  indexes: [{ keys: [{ column: 'email' }] }],
}

export const Changed: Story = {
  args: {
    diff: diffTable(left, right),
  },
}

export const Identical: Story = {
  args: {
    diff: diffTable(left, left),
  },
}

export const AddedFile: Story = {
  args: {
    relPath: 'src\\db\\orders.table.json',
    diff: diffTable(null, right),
  },
}
