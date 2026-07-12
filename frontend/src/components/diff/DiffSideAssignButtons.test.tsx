// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'

import { DiffSideAssignButtons } from './DiffSideAssignButtons'

afterEach(() => {
  cleanup()
})

describe('DiffSideAssignButtons', () => {
  it('左右指定ボタンの aria-label を持つ', () => {
    render(
      <DiffSideAssignButtons
        isLeft={false}
        isRight={false}
        onSelectLeft={() => undefined}
        onSelectRight={() => undefined}
      />,
    )

    expect(screen.getByRole('button', { name: '左に指定' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '右に指定' })).toBeInTheDocument()
  })

  it('活性側に対応するクラスが付く', () => {
    const { rerender } = render(
      <DiffSideAssignButtons
        isLeft
        isRight={false}
        onSelectLeft={() => undefined}
        onSelectRight={() => undefined}
      />,
    )

    expect(screen.getByRole('button', { name: '左に指定' }).className).toMatch(
      /sideLeftActive/,
    )
    expect(
      screen.getByRole('button', { name: '右に指定' }).className,
    ).not.toMatch(/sideRightActive/)

    rerender(
      <DiffSideAssignButtons
        isLeft={false}
        isRight
        onSelectLeft={() => undefined}
        onSelectRight={() => undefined}
      />,
    )

    expect(
      screen.getByRole('button', { name: '左に指定' }).className,
    ).not.toMatch(/sideLeftActive/)
    expect(screen.getByRole('button', { name: '右に指定' }).className).toMatch(
      /sideRightActive/,
    )
  })

  it('クリックで左右それぞれのコールバックを呼ぶ', async () => {
    const user = userEvent.setup()
    const onSelectLeft = vi.fn()
    const onSelectRight = vi.fn()

    render(
      <DiffSideAssignButtons
        isLeft={false}
        isRight={false}
        onSelectLeft={onSelectLeft}
        onSelectRight={onSelectRight}
      />,
    )

    await user.click(screen.getByRole('button', { name: '左に指定' }))
    await user.click(screen.getByRole('button', { name: '右に指定' }))

    expect(onSelectLeft).toHaveBeenCalledTimes(1)
    expect(onSelectRight).toHaveBeenCalledTimes(1)
  })
})
