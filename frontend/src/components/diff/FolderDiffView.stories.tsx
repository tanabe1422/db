import type { Meta, StoryObj } from '@storybook/react-vite'
import { FolderDiffView } from './FolderDiffView'
import type { FileDiffEntry } from '../../hooks/useFolderDiff'

const meta = {
  title: 'Diff/FolderDiffView',
  component: FolderDiffView,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    leftLabel: 'C:\\project-a\\src\\db',
    rightLabel: 'C:\\project-b\\src\\db',
    loading: false,
    error: null,
    onOpenFile: () => undefined,
  },
} satisfies Meta<typeof FolderDiffView>

export default meta
type Story = StoryObj<typeof meta>

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
    diff: null,
    ...overrides,
  }
}

const entries: FileDiffEntry[] = [
  entry('users.table.json', 'changed'),
  entry('orders.table.json', 'added'),
  entry('legacy_logs.table.json', 'removed'),
  entry('tags.table.json', 'same'),
  entry('broken.table.json', 'error', { error: 'JSON の解析に失敗しました' }),
]

export const WithDifferences: Story = {
  args: {
    entries,
    onReload: () => undefined,
    migrateScriptExport: {
      onClick: () => undefined,
      disabled: false,
    },
  },
}

export const ShowUnchanged: Story = {
  args: {
    entries,
    defaultShowSame: true,
    onReload: () => undefined,
  },
}

export const Loading: Story = {
  args: { entries: [], loading: true },
}

export const NoFiles: Story = {
  args: { entries: [] },
}

export const Error: Story = {
  args: { entries: [], error: '比較に失敗しました' },
}
