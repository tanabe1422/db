// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'

import type { FileDiffEntry } from '../../hooks/useFolderDiff'
import { FolderDiffView } from './FolderDiffView'

function entry(
  relPath: string,
  status: FileDiffEntry['status'],
  overrides: Partial<FileDiffEntry> = {},
): FileDiffEntry {
  const leftPath = `C:\\left\\${relPath}`
  const rightPath = `C:\\right\\${relPath}`
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
  entry('legacy.table.json', 'removed'),
  entry('tags.table.json', 'same'),
  entry('broken.table.json', 'error', { error: 'JSON の解析に失敗しました' }),
]

afterEach(() => {
  cleanup()
})

describe('FolderDiffView', () => {
  it('既定では変更なしを隠し、件数バッジを表示する', () => {
    render(
      <FolderDiffView
        leftLabel="left"
        rightLabel="right"
        entries={entries}
        loading={false}
        error={null}
        onOpenFile={() => undefined}
      />,
    )

    expect(screen.getByText('変更 1')).toBeInTheDocument()
    expect(screen.getByText('追加 1')).toBeInTheDocument()
    expect(screen.getByText('削除 1')).toBeInTheDocument()
    expect(screen.getByText('一致 1')).toBeInTheDocument()
    expect(screen.getByText('エラー 1')).toBeInTheDocument()

    expect(screen.getAllByText('users.table.json').length).toBeGreaterThan(0)
    expect(screen.getAllByText('orders.table.json').length).toBeGreaterThan(0)
    expect(screen.getAllByText('legacy.table.json').length).toBeGreaterThan(0)
    expect(screen.getAllByText('broken.table.json').length).toBeGreaterThan(0)
    expect(screen.queryByText('tags.table.json')).not.toBeInTheDocument()
  })

  it('変更なしを表示トグルで same 行を出す', async () => {
    const user = userEvent.setup()

    render(
      <FolderDiffView
        leftLabel="left"
        rightLabel="right"
        entries={entries}
        loading={false}
        error={null}
        onOpenFile={() => undefined}
      />,
    )

    expect(screen.queryByText('tags.table.json')).not.toBeInTheDocument()

    await user.click(screen.getByText('変更なしを表示'))

    expect(screen.getAllByText('tags.table.json').length).toBeGreaterThan(0)
  })

  it('行クリックで onOpenFile を呼び、error 行は disabled', async () => {
    const user = userEvent.setup()
    const onOpenFile = vi.fn()

    render(
      <FolderDiffView
        leftLabel="left"
        rightLabel="right"
        entries={entries}
        loading={false}
        error={null}
        onOpenFile={onOpenFile}
      />,
    )

    const list = screen.getByRole('list')
    const rows = within(list).getAllByRole('button')

    const changedRow = rows.find(
      (row) => within(row).queryAllByText('users.table.json').length > 0,
    )
    expect(changedRow).toBeDefined()
    await user.click(changedRow!)
    expect(onOpenFile).toHaveBeenCalledTimes(1)
    expect(onOpenFile).toHaveBeenCalledWith(
      expect.objectContaining({
        relPath: 'users.table.json',
        status: 'changed',
      }),
    )

    const errorRow = rows.find(
      (row) => within(row).queryAllByText('broken.table.json').length > 0,
    )
    expect(errorRow).toBeDefined()
    expect(errorRow).toBeDisabled()
  })

  it('差分が無いとき空メッセージを出す', () => {
    render(
      <FolderDiffView
        leftLabel="left"
        rightLabel="right"
        entries={[entry('tags.table.json', 'same')]}
        loading={false}
        error={null}
        onOpenFile={() => undefined}
      />,
    )

    expect(
      screen.getByText('差分のあるファイルはありません。'),
    ).toBeInTheDocument()
  })
})
