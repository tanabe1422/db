// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'

import { diffTable } from '../../lib/diffTable'
import { mockTableDefinition } from '../../mocks/data'
import type { TableDefinition } from '../../types'
import { FileDiffView } from './FileDiffView'

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverStub)

const left = mockTableDefinition

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

afterEach(() => {
  cleanup()
})

describe('FileDiffView', () => {
  it('差分セルに added / removed / changed ハイライトクラスが付く', () => {
    const { container } = render(
      <FileDiffView
        relPath="users.table.json"
        diff={diffTable(left, right)}
        onBack={() => undefined}
      />,
    )

    const cells = Array.from(container.querySelectorAll('td'))
    const classNames = cells.map((cell) => cell.className)

    expect(classNames.some((c) => /changedCell/.test(c))).toBe(true)
    expect(classNames.some((c) => /addedCell/.test(c))).toBe(true)
    expect(classNames.some((c) => /removedCell/.test(c))).toBe(true)
  })

  it('同一テーブルではハイライトクラスが付かない', () => {
    const { container } = render(
      <FileDiffView
        relPath="users.table.json"
        diff={diffTable(left, left)}
        onBack={() => undefined}
      />,
    )

    const cells = Array.from(container.querySelectorAll('td'))
    expect(cells.every((cell) => !/(changed|added|removed)Cell/.test(cell.className))).toBe(
      true,
    )
  })

  it('戻るボタンと再読込ボタンがコールバックを呼ぶ', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    const onReload = vi.fn()

    render(
      <FileDiffView
        relPath="users.table.json"
        diff={diffTable(left, right)}
        onBack={onBack}
        onReload={onReload}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'ファイル一覧に戻る' }))
    expect(onBack).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: '再読込' }))
    expect(onReload).toHaveBeenCalledTimes(1)
  })

  it('embedded では戻るボタンを出さない', () => {
    render(
      <FileDiffView
        relPath="users.table.json"
        diff={diffTable(left, right)}
        variant="embedded"
        onBack={() => undefined}
      />,
    )

    expect(
      screen.queryByRole('button', { name: 'ファイル一覧に戻る' }),
    ).not.toBeInTheDocument()
  })
})
