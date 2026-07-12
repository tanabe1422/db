// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

import { WorkspacePlaceholder } from './WorkspacePlaceholder'

afterEach(() => {
  cleanup()
})

describe('WorkspacePlaceholder', () => {
  it('title と message を表示する', () => {
    render(
      <WorkspacePlaceholder title="フォルダを2つ選択" message="説明文です" />,
    )

    expect(
      screen.getByRole('heading', { name: 'フォルダを2つ選択' }),
    ).toBeInTheDocument()
    expect(screen.getByText('説明文です')).toBeInTheDocument()
  })

  it('title なしで message のみ表示できる', () => {
    render(<WorkspacePlaceholder message="読込中..." />)

    expect(screen.queryByRole('heading')).toBeNull()
    expect(screen.getByText('読込中...')).toBeInTheDocument()
  })

  it('path を表示できる', () => {
    render(
      <WorkspacePlaceholder
        title="読込エラー"
        path="/tmp/users.table.json"
        message="失敗しました"
      />,
    )

    expect(screen.getByText('/tmp/users.table.json')).toBeInTheDocument()
    expect(screen.getByText('失敗しました')).toBeInTheDocument()
  })
})
