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
): FileDiffEntry {
  return {
    relPath,
    status,
    leftPath: status === 'added' ? undefined : `left:${relPath}`,
    rightPath: status === 'removed' ? undefined : `right:${relPath}`,
    left: null,
    right: null,
    diff: status === 'changed' || status === 'same' ? mockDiff : null,
  }
}

const entries: FileDiffEntry[] = [
  entry('users.table.json', 'changed'),
  entry('orders.table.json', 'added'),
]

const meta = {
  title: 'Diff/GitDiffWorkspace',
  component: DiffWorkspaceShell,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    ready: true,
    placeholder: {
      title: 'コミットを2つ選択',
      message: (
        <>
          サイドバーで、‹ › ボタンから比較する2つのコミットを選んでください。
          古い方を左、新しい方を右にすると見やすいです。
        </>
      ),
    },
    leftLabel: 'aaa1111 Add users',
    rightLabel: 'bbb2222 Update users',
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
  },
}

export const FileDetail: Story = {
  args: {
    entries: [entry('users.table.json', 'changed')],
    initialOpenRelPath: 'users.table.json',
  },
}
