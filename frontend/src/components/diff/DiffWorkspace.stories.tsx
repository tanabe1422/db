import type { Meta, StoryObj } from '@storybook/react-vite'

import type { FileDiffEntry } from '../../lib/fileDiffEntry'
import type { TableDiff } from '../../lib/diffTable'

import { DiffWorkspaceShell } from './DiffWorkspaceShell'

const mockDiff: TableDiff = {
  meta: [],
  rows: [],
  hasChanges: true,
}

function entry(
  relPath: string,
  status: FileDiffEntry['status'],
  overrides: Partial<FileDiffEntry> = {},
): FileDiffEntry {
  const leftPath = `C:\\project-a\\src\\db\\${relPath}`
  const rightPath = `C:\\project-b\\src\\db\\${relPath}`
  return {
    relPath,
    status,
    leftPath: status === 'added' ? undefined : leftPath,
    rightPath: status === 'removed' ? undefined : rightPath,
    left: null,
    right: null,
    diff: status === 'changed' || status === 'same' ? mockDiff : null,
    ...overrides,
  }
}

const entries: FileDiffEntry[] = [
  entry('users.table.json', 'changed'),
  entry('orders.table.json', 'added'),
  entry('legacy_logs.table.json', 'removed'),
]

const meta = {
  title: 'Diff/DiffWorkspace',
  component: DiffWorkspaceShell,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    ready: true,
    placeholder: {
      title: 'フォルダを2つ選択',
      message:
        'サイドバーで、シェブロン（‹ ›）のボタンから比較する2つのフォルダを選んでください。',
    },
    leftLabel: 'src/db-a',
    rightLabel: 'src/db-b',
    entries: [],
    loading: false,
    error: null,
    onReload: () => undefined,
  },
} satisfies Meta<typeof DiffWorkspaceShell>

export default meta
type Story = StoryObj<typeof meta>

export const Unselected: Story = {
  args: {
    ready: false,
  },
}

export const FileList: Story = {
  args: {
    entries,
    migrateScriptExport: {
      onClick: () => undefined,
      disabled: false,
    },
  },
}

export const FileDetail: Story = {
  args: {
    entries: [entry('users.table.json', 'changed')],
    initialOpenRelPath: 'users.table.json',
  },
}
