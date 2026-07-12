// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'

import type { FileDiffEntry } from '../../hooks/useGitDiff'
import type { TableDiff } from '../../lib/diffTable'
import type { GitCommit } from '../../types'
import { GitDiffWorkspace } from './GitDiffWorkspace'

const reload = vi.fn().mockResolvedValue(undefined)

vi.mock('../../hooks/useGitDiff', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../hooks/useGitDiff')>()
  return {
    ...actual,
    useGitDiff: vi.fn(),
  }
})

import { useGitDiff } from '../../hooks/useGitDiff'

const mockUseGitDiff = vi.mocked(useGitDiff)

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
    leftPath: `left:${relPath}`,
    rightPath: `right:${relPath}`,
    left: null,
    right: null,
    diff: mockDiff,
    ...overrides,
  }
}

function makeCommit(hash: string, shortHash: string, subject: string): GitCommit {
  return { hash, shortHash, subject, date: '2026-01-01T00:00:00Z' }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('GitDiffWorkspace', () => {
  it('左右未選択時はプレースホルダーを表示する', () => {
    mockUseGitDiff.mockReturnValue({
      entries: [],
      loading: false,
      error: null,
      reload,
    })

    render(
      <GitDiffWorkspace
        activeDirectory="C:\\project"
        leftCommit={null}
        rightCommit={null}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'コミットを2つ選択' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/サイドバーで、‹ › ボタンから/, { exact: false }),
    ).toBeInTheDocument()
  })

  it('選択済みならファイル一覧を表示する', () => {
    mockUseGitDiff.mockReturnValue({
      entries: [makeEntry('users.table.json')],
      loading: false,
      error: null,
      reload,
    })

    const left = makeCommit('aaa', 'aaa1111', 'Add users')
    const right = makeCommit('bbb', 'bbb2222', 'Update users')

    render(
      <GitDiffWorkspace
        activeDirectory="C:\\project"
        leftCommit={left}
        rightCommit={right}
      />,
    )

    expect(screen.getByText('aaa1111 Add users')).toBeInTheDocument()
    expect(screen.getByText('bbb2222 Update users')).toBeInTheDocument()
    expect(screen.getAllByText('users.table.json').length).toBeGreaterThan(0)
  })

  it('ファイルを開くと詳細へ遷移し、戻ると一覧に復帰する', async () => {
    const user = userEvent.setup()
    mockUseGitDiff.mockReturnValue({
      entries: [makeEntry('users.table.json')],
      loading: false,
      error: null,
      reload,
    })

    render(
      <GitDiffWorkspace
        activeDirectory="C:\\project"
        leftCommit={makeCommit('aaa', 'aaa1111', 'Add users')}
        rightCommit={makeCommit('bbb', 'bbb2222', 'Update users')}
      />,
    )

    await user.click(screen.getAllByText('users.table.json')[0])
    expect(screen.getByText('ファイル一覧に戻る')).toBeInTheDocument()

    await user.click(screen.getByText('ファイル一覧に戻る'))
    expect(screen.getByText('aaa1111 Add users')).toBeInTheDocument()
    expect(screen.getAllByText('users.table.json').length).toBeGreaterThan(0)
  })
})
