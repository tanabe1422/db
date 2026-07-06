import { describe, expect, it } from 'vitest'

import { errorMessage } from './errorMessage'

describe('errorMessage', () => {
  it('returns Error.message', () => {
    expect(errorMessage(new Error('gen.exe create-script: invalid'), 'fallback')).toBe(
      'gen.exe create-script: invalid',
    )
  })

  it('returns Wails-style string rejections', () => {
    expect(
      errorMessage('gen.exe migrate-script: table not found', 'fallback'),
    ).toBe('gen.exe migrate-script: table not found')
  })

  it('falls back for empty strings and unknown values', () => {
    expect(errorMessage('', 'fallback')).toBe('fallback')
    expect(errorMessage(null, 'fallback')).toBe('fallback')
    expect(errorMessage({ code: 1 }, 'fallback')).toBe('fallback')
  })
})
