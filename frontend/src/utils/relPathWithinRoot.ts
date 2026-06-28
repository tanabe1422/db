function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/+$/, '')
}

/** Returns targetPath relative to root, using forward slashes. */
export function relPathWithinRoot(root: string, targetPath: string): string {
  const normRoot = normalizePath(root)
  const normTarget = normalizePath(targetPath)

  if (normRoot === normTarget) {
    return ''
  }

  const prefix = `${normRoot}/`
  if (!normTarget.toLowerCase().startsWith(prefix.toLowerCase())) {
    return normTarget
  }

  return normTarget.slice(prefix.length)
}
