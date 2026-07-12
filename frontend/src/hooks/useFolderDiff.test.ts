// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'

import type { TreeNode } from '../types'

import { useFolderDiff } from './useFolderDiff'

const { readTableFile } = vi.hoisted(() => ({
  readTableFile: vi.fn(),
}))

vi.mock('../lib/wails', () => ({
  readTableFile,
}))

function file(name: string, path: string): TreeNode {
  return { name, path, isDir: false, children: [] }
}

function dir(name: string, path: string, children: TreeNode[]): TreeNode {
  return { name, path, isDir: true, children }
}

const tableJson = JSON.stringify({
  schemaVersion: 1,
  name: 'users',
  columns: [{ name: 'id', dataType: 'int' }],
})

const otherTableJson = JSON.stringify({
  schemaVersion: 1,
  name: 'users',
  columns: [
    { name: 'id', dataType: 'int' },
    { name: 'name', dataType: 'nvarchar', length: 50 },
  ],
})

afterEach(() => {
  cleanup()
  readTableFile.mockReset()
})

describe('useFolderDiff', () => {
  it('clears entries when either side is null', async () => {
    const { result } = renderHook(() => useFolderDiff(null, null))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.entries).toEqual([])
    expect(result.current.error).toBeNull()
    expect(readTableFile).not.toHaveBeenCalled()
  })

  it('loads matching table.json files from both folders', async () => {
    readTableFile.mockImplementation(async (path: string) => {
      if (path.includes('left')) {
        return tableJson
      }
      return otherTableJson
    })

    const left = dir('db-a', '/left', [file('users.table.json', '/left/users.table.json')])
    const right = dir('db-b', '/right', [
      file('users.table.json', '/right/users.table.json'),
    ])

    const { result } = renderHook(() => useFolderDiff(left, right))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.error).toBeNull()
    expect(result.current.entries).toHaveLength(1)
    expect(result.current.entries[0]).toMatchObject({
      relPath: 'users.table.json',
      status: 'changed',
    })
    expect(readTableFile).toHaveBeenCalledWith('/left/users.table.json')
    expect(readTableFile).toHaveBeenCalledWith('/right/users.table.json')
  })

  it('re-runs when folder nodes change', async () => {
    readTableFile.mockResolvedValue(tableJson)

    const leftA = dir('db-a', '/a', [file('a.table.json', '/a/a.table.json')])
    const rightA = dir('db-b', '/b', [file('a.table.json', '/b/a.table.json')])
    const leftB = dir('db-c', '/c', [file('c.table.json', '/c/c.table.json')])
    const rightB = dir('db-d', '/d', [file('c.table.json', '/d/c.table.json')])

    const { result, rerender } = renderHook(
      ({ left, right }) => useFolderDiff(left, right),
      { initialProps: { left: leftA, right: rightA } },
    )

    await waitFor(() => {
      expect(result.current.entries[0]?.relPath).toBe('a.table.json')
    })

    rerender({ left: leftB, right: rightB })

    await waitFor(() => {
      expect(result.current.entries[0]?.relPath).toBe('c.table.json')
    })
  })

  it('reload re-reads files with the current folders', async () => {
    readTableFile.mockResolvedValue(tableJson)

    const left = dir('db-a', '/left', [file('users.table.json', '/left/users.table.json')])
    const right = dir('db-b', '/right', [
      file('users.table.json', '/right/users.table.json'),
    ])

    const { result } = renderHook(() => useFolderDiff(left, right))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    const callsAfterMount = readTableFile.mock.calls.length

    await act(async () => {
      await result.current.reload()
    })

    expect(readTableFile.mock.calls.length).toBeGreaterThan(callsAfterMount)
    expect(result.current.error).toBeNull()
    expect(result.current.entries).toHaveLength(1)
  })

  it('ignores stale async results when folders change mid-flight', async () => {
    let resolveFirst: ((value: string) => void) | undefined
    const firstRead = new Promise<string>((resolve) => {
      resolveFirst = resolve
    })

    readTableFile
      .mockImplementationOnce(async () => firstRead)
      .mockImplementationOnce(async () => firstRead)
      .mockResolvedValue(otherTableJson)

    const leftSlow = dir('slow', '/slow', [
      file('users.table.json', '/slow/users.table.json'),
    ])
    const rightSlow = dir('slow-r', '/slow-r', [
      file('users.table.json', '/slow-r/users.table.json'),
    ])
    const leftFast = dir('fast', '/fast', [
      file('orders.table.json', '/fast/orders.table.json'),
    ])
    const rightFast = dir('fast-r', '/fast-r', [
      file('orders.table.json', '/fast-r/orders.table.json'),
    ])

    const { result, rerender } = renderHook(
      ({ left, right }) => useFolderDiff(left, right),
      { initialProps: { left: leftSlow, right: rightSlow } },
    )

    await waitFor(() => {
      expect(readTableFile).toHaveBeenCalled()
    })

    rerender({ left: leftFast, right: rightFast })

    await waitFor(() => {
      expect(result.current.entries[0]?.relPath).toBe('orders.table.json')
    })

    await act(async () => {
      resolveFirst?.(tableJson)
    })

    expect(result.current.entries[0]?.relPath).toBe('orders.table.json')
    expect(result.current.entries[0]?.status).toBe('same')
  })

  it('records error status when a side fails to load', async () => {
    readTableFile.mockImplementation(async (path: string) => {
      if (path.includes('left')) {
        throw new Error('boom')
      }
      return tableJson
    })

    const left = dir('db-a', '/left', [file('users.table.json', '/left/users.table.json')])
    const right = dir('db-b', '/right', [
      file('users.table.json', '/right/users.table.json'),
    ])

    const { result } = renderHook(() => useFolderDiff(left, right))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.entries[0]).toMatchObject({
      relPath: 'users.table.json',
      status: 'error',
      error: '左側のファイル読込に失敗しました',
    })
  })
})
