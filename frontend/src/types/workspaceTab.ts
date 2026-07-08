export type DiffTabSource =
  | { type: 'files'; leftPath: string; rightPath: string }
  | { type: 'inline'; leftJson: string; rightJson: string }

export type WorkspaceTab =
  | { kind: 'file'; id: string; path: string }
  | { kind: 'diff'; id: string; label: string; relPath: string; source: DiffTabSource }

export function diffTabIdFromFiles(leftPath: string, rightPath: string): string {
  return `diff:${leftPath}|${rightPath}`
}

export function diffTabIdFromInline(leftJson: string, rightJson: string): string {
  let hash = 0
  const input = `${leftJson}\0${rightJson}`
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  return `diff-preview:${hash >>> 0}`
}

export function diffTabLabel(label: string): string {
  const trimmed = label.trim()
  if (!trimmed) {
    return 'diff'
  }
  return trimmed.endsWith(' (diff)') ? trimmed : `${trimmed} (diff)`
}

export function tabTooltip(tab: WorkspaceTab): string {
  if (tab.kind === 'file') {
    return tab.path
  }
  if (tab.source.type === 'files') {
    return `${tab.source.leftPath} ↔ ${tab.source.rightPath}`
  }
  return tab.label
}

export function tabBaseName(tab: WorkspaceTab): string {
  if (tab.kind === 'file') {
    const parts = tab.path.split(/[\\/]/)
    return parts[parts.length - 1] || tab.path
  }
  return tab.label
}
