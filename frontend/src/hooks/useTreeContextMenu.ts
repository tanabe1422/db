import { useCallback, useState, type MouseEvent } from 'react'

import type { ContextMenuEntry } from '../components/ui/ContextMenu'
import {
  clearFileClipboard,
  getFileClipboard,
  setFileClipboard,
} from '../lib/fileClipboard'
import { exportCreateScripts } from '../lib/scriptExport'
import {
  copyFile,
  createDirectory,
  createTableJSONFile,
  deleteFile,
  moveFile,
  renameEntry,
  showInExplorer,
  type XlsxImportFailure,
} from '../lib/wails'
import { exportXlsxFiles, importXlsxToFolder } from '../lib/xlsxTransfer'
import type { TreeNode } from '../types'

interface ContextMenuState {
  x: number
  y: number
  items: ContextMenuEntry[]
}

interface PromptState {
  title: string
  label?: string
  defaultValue?: string
  onSubmit: (value: string) => void | Promise<void>
}

interface DeleteConfirmState {
  path: string
  name: string
}

interface UseTreeContextMenuOptions {
  activeDirectory: string
  /** When false, the create-script menu item is omitted (e.g. diff folder tree). */
  enableCreateScript?: boolean
  enableXlsxExport?: boolean
  enableXlsxImport?: boolean
  enableFileOperations?: boolean
  onRescan?: () => void | Promise<void>
}

function reportError(err: unknown, fallback: string): void {
  const message = err instanceof Error ? err.message : fallback
  window.alert(message)
}

function appendSection(target: ContextMenuEntry[], section: ContextMenuEntry[]) {
  if (section.length === 0) {
    return
  }
  if (target.length > 0) {
    target.push({ type: 'separator' })
  }
  target.push(...section)
}

export function useTreeContextMenu({
  activeDirectory,
  enableCreateScript = true,
  enableXlsxExport = true,
  enableXlsxImport = true,
  enableFileOperations = false,
  onRescan,
}: UseTreeContextMenuOptions) {
  const [menu, setMenu] = useState<ContextMenuState | null>(null)
  const [importFailures, setImportFailures] = useState<XlsxImportFailure[] | null>(
    null,
  )
  const [prompt, setPrompt] = useState<PromptState | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(
    null,
  )
  const [clipboardVersion, setClipboardVersion] = useState(0)

  const closeMenu = useCallback(() => setMenu(null), [])
  const closeImportFailures = useCallback(() => setImportFailures(null), [])
  const closePrompt = useCallback(() => setPrompt(null), [])
  const closeDeleteConfirm = useCallback(() => setDeleteConfirm(null), [])

  const rescanAfter = useCallback(async () => {
    await onRescan?.()
  }, [onRescan])

  const openPrompt = useCallback((state: PromptState) => {
    setPrompt(state)
  }, [])

  const openNodeMenu = useCallback(
    (node: TreeNode, event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()

      if (!node.path) {
        return
      }

      const items: ContextMenuEntry[] = []
      const clipboard = getFileClipboard()
      void clipboardVersion

      const primarySection: ContextMenuEntry[] = []

      if (enableFileOperations && activeDirectory && node.isDir) {
        primarySection.push(
          {
            label: '新しいjsonファイル',
            onClick: () => {
              openPrompt({
                title: '新しいjsonファイル',
                label: 'テーブル名（*.table.json）',
                onSubmit: async (value) => {
                  const name = value.trim()
                  if (!name) {
                    return
                  }
                  try {
                    await createTableJSONFile(node.path, name)
                    await rescanAfter()
                  } catch (err: unknown) {
                    reportError(err, 'ファイルの作成に失敗しました')
                  }
                },
              })
            },
          },
          {
            label: '新しいフォルダー',
            onClick: () => {
              openPrompt({
                title: '新しいフォルダー',
                label: 'フォルダー名',
                onSubmit: async (value) => {
                  const name = value.trim()
                  if (!name) {
                    return
                  }
                  try {
                    await createDirectory(node.path, name)
                    await rescanAfter()
                  } catch (err: unknown) {
                    reportError(err, 'フォルダーの作成に失敗しました')
                  }
                },
              })
            },
          },
        )
      }

      primarySection.push({
        label: 'エクスプローラーで開く',
        onClick: () => {
          void showInExplorer(node.path)
        },
      })

      appendSection(items, primarySection)

      if (enableFileOperations && activeDirectory) {
        const fileOpsSection: ContextMenuEntry[] = []

        if (node.isDir) {
          fileOpsSection.push(
            {
              label: '名前を変更',
              onClick: () => {
                openPrompt({
                  title: '名前を変更',
                  label: '新しい名前',
                  defaultValue: node.name,
                  onSubmit: async (value) => {
                    const name = value.trim()
                    if (!name || name === node.name) {
                      return
                    }
                    try {
                      await renameEntry(node.path, name)
                      await rescanAfter()
                    } catch (err: unknown) {
                      reportError(err, '名前の変更に失敗しました')
                    }
                  },
                })
              },
            },
            {
              label: '貼り付け',
              disabled: !clipboard,
              onClick: () => {
                const entry = getFileClipboard()
                if (!entry) {
                  return
                }
                void (async () => {
                  try {
                    if (entry.operation === 'copy') {
                      await copyFile(entry.path, node.path)
                    } else {
                      await moveFile(entry.path, node.path)
                      clearFileClipboard()
                      setClipboardVersion((v) => v + 1)
                    }
                    await rescanAfter()
                  } catch (err: unknown) {
                    reportError(err, '貼り付けに失敗しました')
                  }
                })()
              },
            },
          )
        } else {
          fileOpsSection.push(
            {
              label: 'コピー',
              onClick: () => {
                setFileClipboard({ path: node.path, operation: 'copy' })
                setClipboardVersion((v) => v + 1)
              },
            },
            {
              label: '切り取り',
              onClick: () => {
                setFileClipboard({ path: node.path, operation: 'cut' })
                setClipboardVersion((v) => v + 1)
              },
            },
            {
              label: '名前を変更',
              onClick: () => {
                openPrompt({
                  title: '名前を変更',
                  label: '新しい名前',
                  defaultValue: node.name,
                  onSubmit: async (value) => {
                    const name = value.trim()
                    if (!name || name === node.name) {
                      return
                    }
                    try {
                      await renameEntry(node.path, name)
                      await rescanAfter()
                    } catch (err: unknown) {
                      reportError(err, '名前の変更に失敗しました')
                    }
                  },
                })
              },
            },
            {
              label: '削除',
              onClick: () => {
                setDeleteConfirm({ path: node.path, name: node.name })
              },
            },
          )
        }

        appendSection(items, fileOpsSection)
      }

      if (activeDirectory) {
        const toolSection: ContextMenuEntry[] = []

        if (enableCreateScript) {
          toolSection.push({
            label: '作成スクリプト生成',
            onClick: () => {
              void exportCreateScripts(activeDirectory, node).catch((err: unknown) => {
                reportError(err, '作成スクリプトの生成に失敗しました')
              })
            },
          })
        }

        if (enableXlsxImport && node.isDir) {
          toolSection.push({
            label: '定義書インポート',
            onClick: () => {
              void importXlsxToFolder(node.path)
                .then(async (result) => {
                  if (result.imported > 0) {
                    await onRescan?.()
                  }
                  if (result.failures.length > 0) {
                    setImportFailures(result.failures)
                  }
                })
                .catch((err: unknown) => {
                  reportError(err, '定義書のインポートに失敗しました')
                })
            },
          })
        }

        if (enableXlsxExport) {
          toolSection.push({
            label: '定義書エクスポート',
            onClick: () => {
              void exportXlsxFiles(activeDirectory, node).catch((err: unknown) => {
                reportError(err, '定義書のエクスポートに失敗しました')
              })
            },
          })
        }

        appendSection(items, toolSection)
      }

      setMenu({ x: event.clientX, y: event.clientY, items })
    },
    [
      activeDirectory,
      clipboardVersion,
      enableCreateScript,
      enableFileOperations,
      enableXlsxExport,
      enableXlsxImport,
      onRescan,
      openPrompt,
      rescanAfter,
    ],
  )

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirm) {
      return
    }
    try {
      await deleteFile(deleteConfirm.path)
      await rescanAfter()
    } catch (err: unknown) {
      reportError(err, 'ファイルの削除に失敗しました')
    } finally {
      setDeleteConfirm(null)
    }
  }, [deleteConfirm, rescanAfter])

  return {
    menu,
    importFailures,
    prompt,
    deleteConfirm,
    closeImportFailures,
    openNodeMenu,
    closeMenu,
    closePrompt,
    closeDeleteConfirm,
    confirmDelete,
  }
}
