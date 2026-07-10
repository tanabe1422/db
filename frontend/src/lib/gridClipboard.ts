export function copyCellText(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function readCellText(): Promise<string> {
  return navigator.clipboard.readText()
}
