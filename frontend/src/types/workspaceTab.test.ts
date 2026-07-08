import { describe, expect, it } from 'vitest'

import {
  diffTabIdFromFiles,
  diffTabIdFromInline,
  diffTabLabel,
} from './workspaceTab'

describe('workspaceTab helpers', () => {
  it('builds stable diff tab ids', () => {
    const id = diffTabIdFromFiles('C:\\a\\before.table.json', 'C:\\a\\after.table.json')
    expect(id).toBe('diff:C:\\a\\before.table.json|C:\\a\\after.table.json')
  })

  it('builds inline diff tab ids from content', () => {
    const a = diffTabIdFromInline('{"a":1}', '{"a":2}')
    const b = diffTabIdFromInline('{"a":1}', '{"a":2}')
    const c = diffTabIdFromInline('{"a":1}', '{"a":3}')
    expect(a).toBe(b)
    expect(a).not.toBe(c)
  })

  it('formats diff tab labels once', () => {
    expect(diffTabLabel('users.table.json')).toBe('users.table.json (diff)')
    expect(diffTabLabel('users.table.json (diff)')).toBe('users.table.json (diff)')
  })
})
