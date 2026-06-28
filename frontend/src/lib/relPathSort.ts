/** 各階層で直下ファイルをサブディレクトリより先に並べるツリー順比較 */
export function compareRelPaths(a: string, b: string): number {
  const sortKey = (path: string) =>
    path
      .split('/')
      .map((segment, i, parts) =>
        i === parts.length - 1 ? `0_${segment}` : `1_${segment}`,
      )
      .join('\0')

  return sortKey(a).localeCompare(sortKey(b))
}
