import type { Settings, TreeNode } from '../types'
import { mockTableDefinition } from '../mocks/data'

export interface WailsApp {
  GetSettings(): Promise<Settings>
  AddDirectory(path: string): Promise<Settings>
  RemoveDirectory(path: string): Promise<Settings>
  SetActiveDirectory(path: string): Promise<Settings>
  PickDirectory(): Promise<string>
  ScanActiveDirectory(): Promise<TreeNode>
  ReadTableFile(path: string): Promise<string>
  WriteTableFile(path: string, content: string): Promise<void>
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

function touchDirectory(directories: string[], path: string): string[] {
  return [path, ...directories.filter((dir) => dir !== path)]
}

export async function addDirectory(path: string): Promise<Settings> {
  const app = getApp()
  if (app) {
    return normalizeSettings(await app.AddDirectory(path))
  }
  const settings = await getSettings()
  return {
    directories: touchDirectory(settings.directories, path),
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
    directories: touchDirectory(settings.directories, path),
    activeDirectory: path,
  }
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
