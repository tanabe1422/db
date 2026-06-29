import type { GitCommit, GitRepoInfo, Settings, TreeNode } from '../types'
import { mockTableDefinition } from '../mocks/data'

export interface ScriptResult {
  sql: string
  relPath: string
}

export interface XlsxExportResult {
  data: number[]
  relPath: string
}

export interface XlsxImportFailure {
  sourcePath: string
  message: string
}

export interface XlsxImportResult {
  imported: number
  failures: XlsxImportFailure[]
}

export interface FileStat {
  modTimeUnixNano: number
  size: number
}

export interface AISetupResult {
  schemaWritten: boolean
  cursorRuleWritten: boolean
  claudeMdWritten: boolean
  vscodeSettingsWritten: boolean
  tableJsonPatched: number
  tableJsonSkipped: number
  tableJsonFailed: number
  warnings: string[]
}

export interface WailsApp {
  GetSettings(): Promise<Settings>
  AddDirectory(path: string): Promise<Settings>
  RemoveDirectory(path: string): Promise<Settings>
  SetActiveDirectory(path: string): Promise<Settings>
  MoveDirectory(path: string, offset: number): Promise<Settings>
  PickDirectory(): Promise<string>
  ScanActiveDirectory(): Promise<TreeNode>
  StartDirectoryWatch(path: string): Promise<void>
  ReadTableFile(path: string): Promise<string>
  ReadTextFile(path: string): Promise<string>
  GetFileStat(path: string): Promise<FileStat>
  WriteTableFile(path: string, content: string): Promise<void>
  WriteTextFile(path: string, content: string): Promise<void>
  ShowInExplorer(path: string): Promise<void>
  OpenTerminal(path: string): Promise<void>
  OpenWithDefaultApp(path: string): Promise<void>
  PrepareExportDirectory(activeDirectory: string): Promise<string>
  EnsureExportRelDir(exportRoot: string, relativePath: string): Promise<void>
  GenerateCreateScript(tableJSON: string): Promise<ScriptResult>
  GenerateMigrateScript(
    beforeJSON: string,
    afterJSON: string,
  ): Promise<ScriptResult>
  WriteExportFile(
    exportRoot: string,
    relativePath: string,
    content: string,
  ): Promise<void>
  GenerateXlsxExport(tableJSON: string): Promise<XlsxExportResult>
  WriteExportBinaryFile(
    exportRoot: string,
    relativePath: string,
    data: number[],
  ): Promise<void>
  ImportXlsxDirectory(
    sourceDir: string,
    targetDir: string,
  ): Promise<XlsxImportResult>
  ResolveGitRepo(directory: string): Promise<GitRepoInfo>
  ListGitCommits(directory: string, limit: number, offset: number): Promise<GitCommit[]>
  ListGitTableFiles(directory: string, commitHash: string): Promise<string[]>
  ReadGitTableFile(
    directory: string,
    commitHash: string,
    relPath: string,
  ): Promise<string>
  SetZoomLevel(level: number): Promise<number>
  CreateDirectory(parentDir: string, name: string): Promise<void>
  CreateTableJSONFile(parentDir: string, tableName: string): Promise<string>
  RenameEntry(path: string, newName: string): Promise<void>
  DeleteFile(path: string): Promise<void>
  CopyFile(srcPath: string, destDir: string): Promise<string>
  MoveFile(srcPath: string, destDir: string): Promise<string>
  InitAISetup(activeDirectory: string): Promise<AISetupResult>
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

export async function startDirectoryWatch(path: string): Promise<void> {
  const app = getApp()
  if (app) {
    await app.StartDirectoryWatch(path)
    return
  }
  console.info('[mock] startDirectoryWatch', path)
}

export async function readTableFile(path: string): Promise<string> {
  const app = getApp()
  if (app) {
    return app.ReadTableFile(path)
  }
  return JSON.stringify(mockTableDefinition)
}

export async function readTextFile(path: string): Promise<string> {
  const app = getApp()
  if (app) {
    return app.ReadTextFile(path)
  }
  return `-- mock SQL for ${path}\nSELECT 1;\n`
}

export async function writeTextFile(
  path: string,
  content: string,
): Promise<void> {
  const app = getApp()
  if (app) {
    await app.WriteTextFile(path, content)
    return
  }
  console.info('[mock] writeTextFile', path, content)
}

export async function getFileStat(path: string): Promise<FileStat> {
  const app = getApp()
  if (app) {
    return app.GetFileStat(path)
  }
  return {
    modTimeUnixNano: Date.now() * 1_000_000,
    size: 0,
  }
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

export async function openTerminal(path: string): Promise<void> {
  const app = getApp()
  if (app) {
    await app.OpenTerminal(path)
    return
  }
  console.info('[mock] openTerminal', path)
}

export async function openWithDefaultApp(path: string): Promise<void> {
  const app = getApp()
  if (app) {
    await app.OpenWithDefaultApp(path)
    return
  }
  console.info('[mock] openWithDefaultApp', path)
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

export async function generateCreateScript(
  tableFilePath: string,
): Promise<ScriptResult> {
  const app = getApp()
  const tableJSON = app
    ? await app.ReadTableFile(tableFilePath)
    : JSON.stringify(mockTableDefinition)

  return generateCreateScriptFromJSON(tableJSON, { label: tableFilePath })
}

export async function generateCreateScriptFromJSON(
  tableJSON: string,
  labels?: { label?: string },
): Promise<ScriptResult> {
  const app = getApp()
  if (app) {
    return app.GenerateCreateScript(tableJSON)
  }

  const label = labels?.label ?? 'table'
  return {
    sql: `-- mock create script for ${label}\n`,
    relPath: '',
  }
}

export async function generateMigrateScript(
  beforeFilePath: string,
  afterFilePath: string,
): Promise<ScriptResult> {
  const app = getApp()
  const beforeJSON = app
    ? await app.ReadTableFile(beforeFilePath)
    : JSON.stringify(mockTableDefinition)
  const afterJSON = app
    ? await app.ReadTableFile(afterFilePath)
    : JSON.stringify(mockTableDefinition)

  return generateMigrateScriptFromJSON(beforeJSON, afterJSON, {
    beforeLabel: beforeFilePath,
    afterLabel: afterFilePath,
  })
}

export async function generateMigrateScriptFromJSON(
  beforeJSON: string,
  afterJSON: string,
  labels?: { beforeLabel?: string; afterLabel?: string },
): Promise<ScriptResult> {
  const app = getApp()
  if (app) {
    return app.GenerateMigrateScript(beforeJSON, afterJSON)
  }

  const beforeLabel = labels?.beforeLabel ?? 'before'
  const afterLabel = labels?.afterLabel ?? 'after'
  return {
    sql: `-- mock migrate script\n-- before: ${beforeLabel}\n-- after: ${afterLabel}\n`,
    relPath: '',
  }
}

export async function writeExportFile(
  exportRoot: string,
  relativePath: string,
  content: string,
): Promise<void> {
  const app = getApp()
  if (app) {
    await app.WriteExportFile(exportRoot, relativePath, content)
    return
  }
  console.info('[mock] writeExportFile', exportRoot, relativePath, content)
}

export async function generateXlsxExport(
  tableFilePath: string,
): Promise<XlsxExportResult> {
  const app = getApp()
  const tableJSON = app
    ? await app.ReadTableFile(tableFilePath)
    : JSON.stringify(mockTableDefinition)

  if (app) {
    return app.GenerateXlsxExport(tableJSON)
  }

  return {
    data: [0x50, 0x4b, 0x03, 0x04],
    relPath: '',
  }
}

export async function writeExportBinaryFile(
  exportRoot: string,
  relativePath: string,
  data: number[] | Uint8Array,
): Promise<void> {
  const app = getApp()
  const bytes = Array.isArray(data) ? data : Array.from(data)
  if (app) {
    await app.WriteExportBinaryFile(exportRoot, relativePath, bytes)
    return
  }
  console.info('[mock] writeExportBinaryFile', exportRoot, relativePath, bytes.length)
}

export async function importXlsxDirectory(
  sourceDir: string,
  targetDir: string,
): Promise<XlsxImportResult> {
  const app = getApp()
  if (app) {
    return app.ImportXlsxDirectory(sourceDir, targetDir)
  }

  console.info('[mock] importXlsxDirectory', sourceDir, targetDir)
  return { imported: 0, failures: [] }
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

export async function setZoomLevel(level: number): Promise<number> {
  const app = getApp()
  if (app?.SetZoomLevel) {
    return app.SetZoomLevel(level)
  }
  throw new Error('SetZoomLevel is not available')
}

export async function createDirectory(
  parentDir: string,
  name: string,
): Promise<void> {
  const app = getApp()
  if (app) {
    await app.CreateDirectory(parentDir, name)
    return
  }
  console.info('[mock] createDirectory', parentDir, name)
}

export async function createTableJSONFile(
  parentDir: string,
  tableName: string,
): Promise<string> {
  const app = getApp()
  if (app) {
    return app.CreateTableJSONFile(parentDir, tableName)
  }
  const path = `${parentDir}/${tableName}.table.json`
  console.info('[mock] createTableJSONFile', path)
  return path
}

export async function renameEntry(path: string, newName: string): Promise<void> {
  const app = getApp()
  if (app) {
    await app.RenameEntry(path, newName)
    return
  }
  console.info('[mock] renameEntry', path, newName)
}

export async function deleteFile(path: string): Promise<void> {
  const app = getApp()
  if (app) {
    await app.DeleteFile(path)
    return
  }
  console.info('[mock] deleteFile', path)
}

export async function copyFile(
  srcPath: string,
  destDir: string,
): Promise<string> {
  const app = getApp()
  if (app) {
    return app.CopyFile(srcPath, destDir)
  }
  const dest = `${destDir}/${srcPath.split(/[/\\]/).pop()}`
  console.info('[mock] copyFile', srcPath, destDir)
  return dest
}

export async function moveFile(
  srcPath: string,
  destDir: string,
): Promise<string> {
  const app = getApp()
  if (app) {
    return app.MoveFile(srcPath, destDir)
  }
  const dest = `${destDir}/${srcPath.split(/[/\\]/).pop()}`
  console.info('[mock] moveFile', srcPath, destDir)
  return dest
}

export async function initAISetup(
  activeDirectory: string,
): Promise<AISetupResult> {
  const app = getApp()
  if (app?.InitAISetup) {
    const result = await app.InitAISetup(activeDirectory)
    return {
      ...result,
      warnings: result.warnings ?? [],
      tableJsonFailed: result.tableJsonFailed ?? 0,
      claudeMdWritten: result.claudeMdWritten ?? false,
    }
  }
  console.info('[mock] initAISetup', activeDirectory)
  return {
    schemaWritten: true,
    cursorRuleWritten: true,
    claudeMdWritten: true,
    vscodeSettingsWritten: true,
    tableJsonPatched: 0,
    tableJsonSkipped: 0,
    tableJsonFailed: 0,
    warnings: [],
  }
}

function formatExportTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `${pad(date.getHours())}${pad(date.getMinutes())}`
  )
}
