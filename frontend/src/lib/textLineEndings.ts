/** Line ending used when writing text back to disk. */
export type LineEnding = '\n' | '\r\n'

/**
 * Detect the dominant line ending in file content.
 * Prefers CRLF when any `\r\n` is present (typical Windows files).
 */
export function detectLineEnding(content: string): LineEnding {
  return content.includes('\r\n') ? '\r\n' : '\n'
}

/**
 * Normalize to LF for CodeMirror comparison / document text.
 * Handles `\r\n`, lone `\r`, and `\n`.
 */
export function toEditorText(content: string): string {
  return content.replace(/\r\n?/g, '\n')
}

/** Convert editor (LF) text back to the file's original line ending. */
export function fromEditorText(content: string, lineEnding: LineEnding): string {
  if (lineEnding === '\n') {
    return content
  }
  return content.replace(/\n/g, '\r\n')
}
