import type { GitCommit, GitRepoInfo, Settings, TreeNode } from '../types'
import { mockTableDefinition } from '../mocks/data'

export interface WailsApp {
  GetSettings(): Promise<Settings>
  AddDirectory(path: string): Promise<Settings>
  RemoveDirectory(path: string): Promise<Settings>
  SetActiveDirectory(path: string): Promise<Settings>
  MoveDirectory(path: string, offset: number): Promise<Settings>
  PickDirectory(): Promise<string>
  ScanActiveDirectory(): Promise<TreeNode>
  ReadTableFile(path: string): Promise<string>
  WriteTableFile(path: string, content: string): Promise<void>
  ShowInExplorer(path: string): Promise<void>
  PrepareExportDirectory(activeDirectory: string): Promise<string>
  EnsureExportRelDir(exportRoot: string, relativePath: string): Promise<void>
  ResolveGitRepo(directory: string): Promise<GitRepoInfo>
  ListGitCommits(directory: string, limit: number, offset: number): Promise<GitCommit[]>
  ListGitTableFiles(directory: string, commitHash: string): Promise<string[]>
  ReadGitTableFile(
    directory: string,
    commitHash: string,
    relPath: string,
  ): Promise<string>
}

declare global {
  interface Window {
    go?: {
      app: {
        App: WailsApp
      }
    }
  }
}

const mockSettings: Settings = {
  directories: [],
  activeDirectory: '',
}

const mockTree: TreeNode = {
  name: 'sample',
  path: '',
  isDir: true,
  children: [
    {
      name: 'src',
      path: '',
      isDir: true,
      children: [
        {
          name: 'db',
          path: '',
          isDir: true,
          children: [
            {
              name: 'users.table.json',
              path: 'C:\\sample\\src\\db\\users.table.json',
              isDir: false,
              children: [],
            },
          ],
        },
      ],
    },
  ],
}

function getApp(): WailsApp | null {
  return window.go?.app?.App ?? null
}

function isWailsRuntime(): boolean {
  return getApp() !== null
}

function hasGitBindings(): boolean {
  return typeof getApp()?.ResolveGitRepo === 'function'
}

function requireGitBindings(): void {
  if (isWailsRuntime() && !hasGitBindings()) {
    throw new Error(
      'Git API がバインドされていません。ターミナルで wails dev を一度終了し、再起動してください。',
    )
  }
}

function normalizeSettings(raw: Settings): Settings {
  return {
    directories: raw.directories ?? [],
    activeDirectory: raw.activeDirectory ?? '',
  }
}

export async function getSettings(): Promise<Settings> {
  const app = getApp()
  if (app) {
    return normalizeSettings(await app.GetSettings())
  }
  return mockSettings
}

function appendDirectory(directories: string[], path: string): string[] {
  if (directories.includes(path)) {
    return directories
  }
  return [...directories, path]
}

export async function addDirectory(path: string): Promise<Settings> {
  const app = getApp()
  if (app) {
    return normalizeSettings(await app.AddDirectory(path))
  }
  const settings = await getSettings()
  if (settings.directories.includes(path)) {
    return { ...settings, activeDirectory: path }
  }
  return {
    directories: appendDirectory(settings.directories, path),
    activeDirectory: path,
  }
}

export async function removeDirectory(path: string): Promise<Settings> {
  const app = getApp()
  if (app) {
    return normalizeSettings(await app.RemoveDirectory(path))
  }
  const settings = await getSettings()
  const directories = settings.directories.filter((dir) => dir !== path)
  return {
    directories,
    activeDirectory:
      settings.activeDirectory === path
        ? directories[0] ?? ''
        : settings.activeDirectory,
  }
}

export async function setActiveDirectory(path: string): Promise<Settings> {
  const app = getApp()
  if (app) {
    return normalizeSettings(await app.SetActiveDirectory(path))
  }
  const settings = await getSettings()
  if (!settings.directories.includes(path)) {
    return settings
  }
  return {
    ...settings,
    activeDirectory: path,
  }
}

export async function moveDirectory(
  path: string,
  offset: -1 | 1,
): Promise<Settings> {
  const app = getApp()
  if (app) {
    return normalizeSettings(await app.MoveDirectory(path, offset))
  }
  const settings = await getSettings()
  const index = settings.directories.indexOf(path)
  if (index < 0) {
    return settings
  }
  const target = index + offset
  if (target < 0 || target >= settings.directories.length) {
    return settings
  }
  const directories = [...settings.directories]
  ;[directories[index], directories[target]] = [
    directories[target],
    directories[index],
  ]
  return { ...settings, directories }
}

export async function pickDirectory(): Promise<string> {
  const app = getApp()
  if (app) {
    return app.PickDirectory()
  }
  return ''
}

export async function scanActiveDirectory(): Promise<TreeNode> {
  const app = getApp()
  if (app) {
    return app.ScanActiveDirectory()
  }
  return mockTree
}

export async function readTableFile(path: string): Promise<string> {
  const app = getApp()
  if (app) {
    return app.ReadTableFile(path)
  }
  return JSON.stringify(mockTableDefinition)
}

export async function writeTableFile(
  path: string,
  content: string,
): Promise<void> {
  const app = getApp()
  if (app) {
    await app.WriteTableFile(path, content)
    return
  }
  console.info('[mock] writeTableFile', path, content)
}

export async function showInExplorer(path: string): Promise<void> {
  const app = getApp()
  if (app) {
    await app.ShowInExplorer(path)
    return
  }
  console.info('[mock] showInExplorer', path)
}

export async function prepareExportDirectory(
  activeDirectory: string,
): Promise<string> {
  const app = getApp()
  if (app) {
    return app.PrepareExportDirectory(activeDirectory)
  }
  const stamp = formatExportTimestamp(new Date())
  const exportRoot = `${activeDirectory}/export/${stamp}`
  console.info('[mock] prepareExportDirectory', exportRoot)
  return exportRoot
}

export async function ensureExportRelDir(
  exportRoot: string,
  relativePath: string,
): Promise<void> {
  const app = getApp()
  if (app) {
    await app.EnsureExportRelDir(exportRoot, relativePath)
    return
  }
  console.info('[mock] ensureExportRelDir', exportRoot, relativePath)
}

const mockCommits: GitCommit[] = [
  {
    hash: 'cccccccccccccccccccccccccccccccccccccccc',
    shortHash: 'ccc3333',
    subject: 'products テーブルを追加',
    date: '2026-01-15 10:00:00 +0900',
  },
  {
    hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    shortHash: 'bbb2222',
    subject: 'orders を追加し users を更新',
    date: '2026-01-10 10:00:00 +0900',
  },
  {
    hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    shortHash: 'aaa1111',
    subject: 'users テーブルを追加',
    date: '2026-01-05 10:00:00 +0900',
  },
]

export async function resolveGitRepo(directory: string): Promise<GitRepoInfo> {
  if (hasGitBindings()) {
    return getApp()!.ResolveGitRepo(directory)
  }
  requireGitBindings()
  return {
    isRepo: directory.includes('git-diff-demo'),
    repoRoot: directory || '',
  }
}

export async function listGitCommits(
  directory: string,
  limit: number,
  offset: number,
): Promise<GitCommit[]> {
  if (hasGitBindings()) {
    return getApp()!.ListGitCommits(directory, limit, offset)
  }
  requireGitBindings()
  return mockCommits.slice(offset, offset + limit)
}

export async function listGitTableFiles(
  directory: string,
  commitHash: string,
): Promise<string[]> {
  if (hasGitBindings()) {
    return getApp()!.ListGitTableFiles(directory, commitHash)
  }
  requireGitBindings()
  if (commitHash.startsWith('aaa')) {
    return ['users.table.json']
  }
  if (commitHash.startsWith('bbb')) {
    return ['users.table.json', 'orders.table.json']
  }
  return ['users.table.json', 'orders.table.json', 'products.table.json']
}

export async function readGitTableFile(
  directory: string,
  commitHash: string,
  relPath: string,
): Promise<string> {
  if (hasGitBindings()) {
    return getApp()!.ReadGitTableFile(directory, commitHash, relPath)
  }
  requireGitBindings()
  return JSON.stringify(mockTableDefinition)
}

function formatExportTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `${pad(date.getHours())}${pad(date.getMinutes())}`
  )
}
