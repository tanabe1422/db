// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'

import type { FileDiffEntry } from '../../hooks/useFolderDiff'
import type { TableDiff } from '../../lib/diffTable'
import type { TreeNode } from '../../types'
import { DiffWorkspace } from './DiffWorkspace'

const reload = vi.fn().mockResolvedValue(undefined)

vi.mock('../../hooks/useFolderDiff', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../hooks/useFolderDiff')>()
  return {
    ...actual,
    useFolderDiff: vi.fn(),
  }
})

import { useFolderDiff } from '../../hooks/useFolderDiff'

const mockUseFolderDiff = vi.mocked(useFolderDiff)

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverStub)

const mockDiff: TableDiff = {
  meta: [],
  rows: [],
  hasChanges: true,
}

function makeEntry(
  relPath: string,
  overrides: Partial<FileDiffEntry> = {},
): FileDiffEntry {
  return {
    relPath,
    status: 'changed',
    leftPath: `C:\\left\\${relPath}`,
    rightPath: `C:\\right\\${relPath}`,
    left: null,
    right: null,
    diff: mockDiff,
    ...overrides,
  }
}

function makeNode(name: string, path: string): TreeNode {
  return { name, path, isDir: true, children: [] }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('DiffWorkspace', () => {
  it('左右未選択時はプレースホルダーを表示する', () => {
    mockUseFolderDiff.mockReturnValue({
      entries: [],
      loading: false,
      error: null,
      reload,
    })

    render(
      <DiffWorkspace
        activeDirectory="C:\\project"
        leftNode={null}
        rightNode={null}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'フォルダを2つ選択' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/サイドバーで、シェブロン/, { exact: false }),
    ).toBeInTheDocument()
  })

  it('選択済みならファイル一覧を表示する', () => {
    mockUseFolderDiff.mockReturnValue({
      entries: [makeEntry('users.table.json')],
      loading: false,
      error: null,
      reload,
    })

    render(
      <DiffWorkspace
        activeDirectory="C:\\project"
        leftNode={makeNode('db-a', 'C:\\project\\db-a')}
        rightNode={makeNode('db-b', 'C:\\project\\db-b')}
      />,
    )

    expect(screen.getByText(/db-a/)).toBeInTheDocument()
    expect(screen.getByText(/db-b/)).toBeInTheDocument()
    expect(screen.getAllByText('users.table.json').length).toBeGreaterThan(0)
  })

  it('ファイルを開くと詳細へ遷移し、戻ると一覧に復帰する', async () => {
    const user = userEvent.setup()
    mockUseFolderDiff.mockReturnValue({
      entries: [makeEntry('users.table.json')],
      loading: false,
      error: null,
      reload,
    })

    render(
      <DiffWorkspace
        activeDirectory="C:\\project"
        leftNode={makeNode('db-a', 'C:\\project\\db-a')}
        rightNode={makeNode('db-b', 'C:\\project\\db-b')}
      />,
    )

    await user.click(screen.getAllByText('users.table.json')[0])
    expect(screen.getByText('ファイル一覧に戻る')).toBeInTheDocument()
    expect(screen.getByText('users.table.json')).toBeInTheDocument()

    await user.click(screen.getByText('ファイル一覧に戻る'))
    expect(screen.getByText(/db-a/)).toBeInTheDocument()
    expect(screen.getAllByText('users.table.json').length).toBeGreaterThan(0)
  })
})
