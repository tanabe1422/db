// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'

import { AlertDialog } from './AlertDialog'
import { ConfirmDialog } from './ConfirmDialog'
import { ExternalFileChangeDialog } from './ExternalFileChangeDialog'
import { PromptDialog } from './PromptDialog'

afterEach(() => {
  cleanup()
})

describe('ConfirmDialog', () => {
  it('open=false のときは何も表示しない', () => {
    render(
      <ConfirmDialog
        open={false}
        title="確認"
        message="実行しますか？"
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('確認・キャンセルでコールバックを呼ぶ', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConfirmDialog
        open
        title="未保存の変更"
        message="閉じますか？"
        confirmLabel="閉じる"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '未保存の変更' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '閉じる' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('背景クリックで onCancel を呼ぶ', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()

    render(
      <ConfirmDialog
        open
        title="確認"
        message="実行しますか？"
        onConfirm={() => undefined}
        onCancel={onCancel}
      />,
    )

    await user.click(screen.getByRole('dialog').parentElement!)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

describe('AlertDialog', () => {
  it('items を一覧表示し、OK で閉じる', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <AlertDialog
        open
        title="検証エラー"
        message="修正してください"
        items={[{ label: 'name', detail: '必須です' }]}
        onClose={onClose}
      />,
    )

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('name')).toBeInTheDocument()
    expect(screen.getByText('必須です')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'OK' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('PromptDialog', () => {
  it('入力値を確定で返す', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(
      <PromptDialog
        open
        title="名前を入力"
        label="新しい名前"
        defaultValue="users"
        onConfirm={onConfirm}
        onCancel={() => undefined}
      />,
    )

    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'orders')
    await user.click(screen.getByRole('button', { name: 'OK' }))

    expect(onConfirm).toHaveBeenCalledWith('orders')
  })
})

describe('ExternalFileChangeDialog', () => {
  it('再読み込み・無視・キャンセルを呼び分ける', async () => {
    const user = userEvent.setup()
    const onReload = vi.fn()
    const onIgnore = vi.fn()
    const onCancel = vi.fn()

    render(
      <ExternalFileChangeDialog
        open
        fileName="users.table.json"
        onReload={onReload}
        onIgnore={onIgnore}
        onCancel={onCancel}
      />,
    )

    expect(screen.getByText(/users\.table\.json/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '再読み込み' }))
    await user.click(screen.getByRole('button', { name: '無視' }))
    await user.click(screen.getByRole('button', { name: 'キャンセル' }))

    expect(onReload).toHaveBeenCalledTimes(1)
    expect(onIgnore).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
