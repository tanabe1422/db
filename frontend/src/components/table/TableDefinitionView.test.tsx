// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'

import type { TableDefinition } from '../../types'
import { writeTableFile } from '../../lib/wails'
import { TableDefinitionView } from './TableDefinitionView'

vi.mock('../../lib/wails', () => ({
  writeTableFile: vi.fn().mockResolvedValue(undefined),
}))

const mockWrite = vi.mocked(writeTableFile)

function makeDefinition(): TableDefinition {
  return {
    schemaVersion: 1,
    name: 'users',
    columns: [{ name: 'id', dataType: 'bigint' }],
  }
}

beforeEach(() => {
  mockWrite.mockClear()
})

afterEach(() => {
  cleanup()
})

describe('TableDefinitionView クリック挙動', () => {
  it('1回目クリックで選択のみ、2回目クリックで編集（input表示）', async () => {
    const user = userEvent.setup()
    render(<TableDefinitionView definition={makeDefinition()} path="/tmp/users.table.json" />)

    const cell = await screen.findByText('id')

    await user.click(cell)
    // 1回目クリック後は編集モードに入っていない（input未表示）。
    expect(screen.queryByDisplayValue('id')).toBeNull()

    await user.click(cell)
    // 2回目クリックで編集モードに入り、input が表示される。
    expect(screen.getByDisplayValue('id')).toBeInTheDocument()
  })

  it('選択済みセルをクリックで編集すると、キャレットは末尾（全選択しない）', async () => {
    const user = userEvent.setup()
    render(<TableDefinitionView definition={makeDefinition()} path="/tmp/users.table.json" />)

    const cell = await screen.findByText('id')
    await user.click(cell)
    await user.click(cell)

    const input = screen.getByDisplayValue('id') as HTMLInputElement
    expect(input.selectionStart).toBe(input.value.length)
    expect(input.selectionEnd).toBe(input.value.length)
  })

  it('選択済みセルでキー入力すると既存値を上書きして入力する', async () => {
    const user = userEvent.setup()
    render(<TableDefinitionView definition={makeDefinition()} path="/tmp/users.table.json" />)

    const cell = await screen.findByText('id')
    await user.click(cell)
    await user.keyboard('x')

    // 既存値 'id' は破棄され、入力した 'x' だけが残る。
    const input = screen.getByDisplayValue('x') as HTMLInputElement
    expect(input.value).toBe('x')
  })
})

describe('TableDefinitionView 未保存判定', () => {
  it('値を変えずに編集を終えても未保存にならない', async () => {
    const user = userEvent.setup()
    render(<TableDefinitionView definition={makeDefinition()} path="/tmp/users.table.json" />)

    const cell = await screen.findByText('id')
    // 2回クリックで編集開始（input表示）。
    await user.click(cell)
    await user.click(cell)
    expect(screen.getByDisplayValue('id')).toBeInTheDocument()

    // 値を変えずに別セルへ移動して編集終了。
    await user.click(screen.getByText('bigint'))

    expect(screen.getByText('保存済み')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /保存/ })).toBeDisabled()
  })

  it('値を変更して編集を終えると未保存になる', async () => {
    const user = userEvent.setup()
    render(<TableDefinitionView definition={makeDefinition()} path="/tmp/users.table.json" />)

    const cell = await screen.findByText('id')
    await user.click(cell)
    await user.click(cell)

    const input = screen.getByDisplayValue('id') as HTMLInputElement
    await user.clear(input)
    await user.type(input, 'user_id')

    // 別セルへ移動して編集終了。
    await user.click(screen.getByText('bigint'))

    expect(screen.getByText('未保存の変更あり')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /保存/ })).toBeEnabled()
  })
})

describe('TableDefinitionView データ型セル(combobox)', () => {
  it('データ型セルは1回目クリックで選択のみ、2回目で編集に入る', async () => {
    const user = userEvent.setup()
    render(<TableDefinitionView definition={makeDefinition()} path="/tmp/users.table.json" />)

    const cell = await screen.findByText('bigint')
    await user.click(cell)
    expect(screen.queryByDisplayValue('bigint')).toBeNull()

    await user.click(cell)
    const input = screen.getByDisplayValue('bigint') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input).not.toHaveAttribute('list')
  })

  it('候補リストから型を選択できる', async () => {
    const user = userEvent.setup()
    render(<TableDefinitionView definition={makeDefinition()} path="/tmp/users.table.json" />)

    await user.click(screen.getByRole('button', { name: '型の候補を表示' }))
    await user.click(screen.getByRole('button', { name: 'int' }))

    expect(screen.getByDisplayValue('int')).toBeInTheDocument()
  })

  it('未選択の型セルで三角をクリックすると候補リストが開く', async () => {
    const user = userEvent.setup()
    render(<TableDefinitionView definition={makeDefinition()} path="/tmp/users.table.json" />)

    await user.click(screen.getByRole('button', { name: '型の候補を表示' }))

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByDisplayValue('bigint')).toBeInTheDocument()
  })

  it('未選択の型セル本体をクリックすると選択のみ', async () => {
    const user = userEvent.setup()
    render(<TableDefinitionView definition={makeDefinition()} path="/tmp/users.table.json" />)

    await user.click(await screen.findByText('bigint'))

    expect(screen.queryByDisplayValue('bigint')).toBeNull()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('選択済みの型セル本体をクリックしても候補リストは開かない', async () => {
    const user = userEvent.setup()
    render(<TableDefinitionView definition={makeDefinition()} path="/tmp/users.table.json" />)

    const cell = await screen.findByText('bigint')
    await user.click(cell)
    await user.click(cell)

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('入力中は候補リストを表示しない', async () => {
    const user = userEvent.setup()
    render(<TableDefinitionView definition={makeDefinition()} path="/tmp/users.table.json" />)

    const cell = await screen.findByText('bigint')
    await user.click(cell)
    await user.click(cell)

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    const input = screen.getByDisplayValue('bigint') as HTMLInputElement
    await user.type(input, 'x')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('自由入力で任意の型を指定できる', async () => {
    const user = userEvent.setup()
    render(<TableDefinitionView definition={makeDefinition()} path="/tmp/users.table.json" />)

    const cell = await screen.findByText('bigint')
    await user.click(cell)
    await user.click(cell)

    const input = screen.getByDisplayValue('bigint') as HTMLInputElement
    await user.clear(input)
    await user.type(input, 'text')

    await user.click(screen.getByText('id'))

    expect(screen.getByText('text')).toBeInTheDocument()
  })

  it('行追加直後の型セルは int を表示する', async () => {
    const user = userEvent.setup()
    render(<TableDefinitionView definition={makeDefinition()} path="/tmp/users.table.json" />)

    await user.click(await screen.findByLabelText('下に新しい行を追加'))

    expect(screen.getByText('int')).toBeInTheDocument()
  })

  it('行追加直後に型セルを編集すると int が入力欄に入っている', async () => {
    const user = userEvent.setup()
    render(<TableDefinitionView definition={makeDefinition()} path="/tmp/users.table.json" />)

    await user.click(await screen.findByLabelText('下に新しい行を追加'))
    await user.click(screen.getByText('int'))
    await user.click(screen.getByText('int'))

    expect(screen.getByDisplayValue('int')).toBeInTheDocument()
  })

  it('型変更後にデータ型セルの表示が更新される', async () => {
    const user = userEvent.setup()
    render(<TableDefinitionView definition={makeDefinition()} path="/tmp/users.table.json" />)

    const cell = await screen.findByText('bigint')
    await user.click(cell)
    await user.click(cell)

    const input = screen.getByDisplayValue('bigint') as HTMLInputElement
    await user.clear(input)
    await user.type(input, 'int')
    // 別セルへ移動して編集終了 → セル表示が 'int' になる。
    await user.click(screen.getByText('id'))

    expect(screen.getByText('int')).toBeInTheDocument()
  })
})

describe('TableDefinitionView キーボード操作', () => {
  it('選択済みセルで Enter を押すと編集に入り全選択される', async () => {
    const user = userEvent.setup()
    render(<TableDefinitionView definition={makeDefinition()} path="/tmp/users.table.json" />)

    await user.click(await screen.findByText('id'))
    await user.keyboard('{Enter}')

    const input = screen.getByDisplayValue('id') as HTMLInputElement
    // Enter 起点の編集は全選択（先頭〜末尾を選択）。
    expect(input.selectionStart).toBe(0)
    expect(input.selectionEnd).toBe(input.value.length)
  })

  it('チェックボックスセルのクリックでフラグがトグルする', async () => {
    const user = userEvent.setup()
    render(<TableDefinitionView definition={makeDefinition()} path="/tmp/users.table.json" />)

    const pk = (await screen.findByLabelText('PK')) as HTMLInputElement
    expect(pk.checked).toBe(false)

    await user.click(pk)
    expect(((await screen.findByLabelText('PK')) as HTMLInputElement).checked).toBe(true)
  })
})

describe('TableDefinitionView 保存前検証', () => {
  it('空カラム追加直後はライブ検証エラーを表示しない', async () => {
    const user = userEvent.setup()
    render(<TableDefinitionView definition={makeDefinition()} path="/tmp/users.table.json" />)

    await user.click(await screen.findByLabelText('下に新しい行を追加'))

    expect(screen.queryByText(/検証エラー/)).toBeNull()
  })

  it('フォーマットNGのまま保存するとエラー表示し、保存はブロックされる', async () => {
    const user = userEvent.setup()
    render(<TableDefinitionView definition={makeDefinition()} path="/tmp/users.table.json" />)

    // 空名カラムを追加 → name が必須のため不正な状態になる。
    await user.click(await screen.findByLabelText('下に新しい行を追加'))

    await user.click(screen.getByRole('button', { name: /保存/ }))

    expect(screen.getByText(/検証エラー/)).toBeInTheDocument()
    expect(mockWrite).not.toHaveBeenCalled()
  })

  it('フォーマットOKなら保存で writeTableFile が呼ばれる', async () => {
    const user = userEvent.setup()
    render(<TableDefinitionView definition={makeDefinition()} path="/tmp/users.table.json" />)

    // PK チェックを切り替えて dirty にする（検証は通る）。
    const checkboxes = await screen.findAllByRole('checkbox')
    await user.click(checkboxes[0])

    await user.click(screen.getByRole('button', { name: /保存/ }))

    expect(screen.queryByText(/検証エラー/)).toBeNull()
    expect(mockWrite).toHaveBeenCalledTimes(1)
  })
})
