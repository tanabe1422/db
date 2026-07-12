import { describe, expect, it } from 'vitest'

import {
  detectLineEnding,
  fromEditorText,
  toEditorText,
} from './textLineEndings'

describe('textLineEndings', () => {
  it('detects CRLF when present', () => {
    expect(detectLineEnding('a\r\nb\r\n')).toBe('\r\n')
    expect(detectLineEnding('a\nb\r\nc\n')).toBe('\r\n')
  })

  it('detects LF when no CRLF', () => {
    expect(detectLineEnding('a\nb\n')).toBe('\n')
    expect(detectLineEnding('')).toBe('\n')
    expect(detectLineEnding('single line')).toBe('\n')
  })

  it('normalizes CRLF and CR to LF for the editor', () => {
    expect(toEditorText('a\r\nb\r\n')).toBe('a\nb\n')
    expect(toEditorText('a\rb\r')).toBe('a\nb\n')
    expect(toEditorText('a\nb\n')).toBe('a\nb\n')
  })

  it('round-trips CRLF files without changing line endings', () => {
    const disk = 'SELECT 1;\r\nSELECT 2;\r\n'
    const editor = toEditorText(disk)
    expect(editor).toBe('SELECT 1;\nSELECT 2;\n')
    expect(fromEditorText(editor, detectLineEnding(disk))).toBe(disk)
  })

  it('keeps LF files as LF on write-back', () => {
    const disk = 'SELECT 1;\nSELECT 2;\n'
    const editor = toEditorText(disk)
    expect(fromEditorText(editor, detectLineEnding(disk))).toBe(disk)
  })

  it('treats editor text equal after CRLF normalize (false dirty case)', () => {
    const fromDisk = 'foo\r\nbar\r\n'
    const fromEditor = 'foo\nbar\n'
    expect(toEditorText(fromDisk)).toBe(fromEditor)
  })
})
