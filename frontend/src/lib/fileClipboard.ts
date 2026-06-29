export type FileClipboardOperation = 'copy' | 'cut'

export interface FileClipboardEntry {
  path: string
  operation: FileClipboardOperation
}

let clipboard: FileClipboardEntry | null = null

export function getFileClipboard(): FileClipboardEntry | null {
  return clipboard
}

export function setFileClipboard(entry: FileClipboardEntry): void {
  clipboard = entry
}

export function clearFileClipboard(): void {
  clipboard = null
}

export function hasFileClipboard(): boolean {
  return clipboard !== null
}
