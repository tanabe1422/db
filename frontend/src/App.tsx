import { useCallback, useState } from 'react'
import { MainLayout } from './components/layout/MainLayout'
import { DirectoryPanel } from './components/sidebar/DirectoryPanel'
import { SettingsDialog } from './components/settings/SettingsDialog'
import { ConfirmDialog } from './components/ui/ConfirmDialog'
import { TabBar } from './components/tabs/TabBar'
import { TableDefinitionView } from './components/table/TableDefinitionView'
import { DiffSetupPanel } from './components/diff/DiffSetupPanel'
import { FolderDiffView } from './components/diff/FolderDiffView'
import { FileDiffView } from './components/diff/FileDiffView'
import { useDirectoryScan } from './hooks/useDirectoryScan'
import { useFolderDiff, type FileDiffEntry } from './hooks/useFolderDiff'
import { useSettings } from './hooks/useSettings'
import { useTableDefinition } from './hooks/useTableDefinition'
import type { TreeNode } from './types'
import styles from './App.module.css'

function TableDefinitionPanel({
  path,
  onDirtyChange,
}: {
  path: string
  onDirtyChange?: (dirty: boolean) => void
}) {
  const { definition, loading, error } = useTableDefinition(path)

  if (loading) {
    return (
      <div className={styles.placeholder}>
        <p>読込中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.placeholder}>
        <h2>読込エラー</h2>
        <p className={styles.path}>{path}</p>
        <p>{error}</p>
      </div>
    )
  }

  if (!definition) {
    return null
  }

  return (
    <TableDefinitionView
      definition={definition}
      path={path}
      onDirtyChange={onDirtyChange}
    />
  )
}

function diffLabel(node: TreeNode | null): string {
  return node?.path || node?.name || ''
}

function DiffWorkspace({
  leftNode,
  rightNode,
}: {
  leftNode: TreeNode | null
  rightNode: TreeNode | null
}) {
  const { entries, loading, error } = useFolderDiff(leftNode, rightNode)
  const [openRelPath, setOpenRelPath] = useState<string | null>(null)

  if (!leftNode || !rightNode) {
    return (
      <div className={styles.placeholder}>
        <h2>フォルダを2つ選択</h2>
        <p>左のパネルで、シェブロン（‹ ›）のボタンから比較する2つのフォルダを選んでください。</p>
      </div>
    )
  }

  const openEntry: FileDiffEntry | null =
    openRelPath != null
      ? entries.find((entry) => entry.relPath === openRelPath) ?? null
      : null

  if (openEntry && openEntry.diff) {
    return (
      <FileDiffView
        relPath={openEntry.relPath}
        diff={openEntry.diff}
        onBack={() => setOpenRelPath(null)}
      />
    )
  }

  return (
    <FolderDiffView
      leftLabel={diffLabel(leftNode)}
      rightLabel={diffLabel(rightNode)}
      entries={entries}
      loading={loading}
      error={error}
      onOpenFile={(entry) => setOpenRelPath(entry.relPath)}
    />
  )
}

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [openPaths, setOpenPaths] = useState<string[]>([])
  const [activePath, setActivePath] = useState('')
  const [dirtyPaths, setDirtyPaths] = useState<Set<string>>(new Set())
  const [closingPath, setClosingPath] = useState<string | null>(null)
  const [mode, setMode] = useState<'edit' | 'diff'>('edit')
  const [leftNode, setLeftNode] = useState<TreeNode | null>(null)
  const [rightNode, setRightNode] = useState<TreeNode | null>(null)

  const { settings, addDirectory, removeDirectory, setActiveDirectory } =
    useSettings()

  const { tree, loading, error, rescan } = useDirectoryScan(
    settings.activeDirectory,
  )

  const handleSelectFile = useCallback((path: string) => {
    setOpenPaths((prev) => (prev.includes(path) ? prev : [...prev, path]))
    setActivePath(path)
  }, [])

  const updateDirty = useCallback((path: string, dirty: boolean) => {
    setDirtyPaths((prev) => {
      if (prev.has(path) === dirty) {
        return prev
      }
      const next = new Set(prev)
      if (dirty) {
        next.add(path)
      } else {
        next.delete(path)
      }
      return next
    })
  }, [])

  const closeTab = (path: string) => {
    const idx = openPaths.indexOf(path)
    const next = openPaths.filter((p) => p !== path)
    setOpenPaths(next)
    setDirtyPaths((prev) => {
      if (!prev.has(path)) {
        return prev
      }
      const cloned = new Set(prev)
      cloned.delete(path)
      return cloned
    })
    if (activePath === path) {
      setActivePath(next.length === 0 ? '' : next[Math.min(idx, next.length - 1)])
    }
  }

  const handleRequestClose = (path: string) => {
    if (dirtyPaths.has(path)) {
      setClosingPath(path)
    } else {
      closeTab(path)
    }
  }

  const handleConfirmClose = () => {
    if (closingPath) {
      closeTab(closingPath)
    }
    setClosingPath(null)
  }

  const resetTabs = useCallback(() => {
    setOpenPaths([])
    setActivePath('')
    setDirtyPaths(new Set())
    setClosingPath(null)
  }, [])

  const handleAdd = useCallback(async () => {
    await addDirectory()
    await rescan()
  }, [addDirectory, rescan])

  const handleRemove = useCallback(
    async (path: string) => {
      await removeDirectory(path)
      await rescan()
    },
    [removeDirectory, rescan],
  )

  const handleSetActive = useCallback(
    async (path: string) => {
      await setActiveDirectory(path)
      resetTabs()
      await rescan()
    },
    [setActiveDirectory, rescan, resetTabs],
  )

  const enterDiffMode = useCallback(() => {
    setMode('diff')
  }, [])

  const exitDiffMode = useCallback(() => {
    setMode('edit')
    setLeftNode(null)
    setRightNode(null)
  }, [])

  return (
    <>
      <MainLayout
        onOpenSettings={() => setSettingsOpen(true)}
        sidebar={
          mode === 'diff' ? (
            <DiffSetupPanel
              activeDirectory={settings.activeDirectory}
              tree={tree}
              leftPath={leftNode?.path}
              rightPath={rightNode?.path}
              onSelectLeft={setLeftNode}
              onSelectRight={setRightNode}
              onExitDiff={exitDiffMode}
            />
          ) : (
            <DirectoryPanel
              activeDirectory={settings.activeDirectory}
              tree={tree}
              loading={loading}
              error={error}
              selectedPath={activePath}
              onSelectFile={handleSelectFile}
              onManageDirectories={() => setSettingsOpen(true)}
              onRescan={() => void rescan()}
              onEnterDiffMode={enterDiffMode}
            />
          )
        }
      >
        {mode === 'diff' ? (
          <div className={styles.workspace}>
            <div className={styles.content}>
              <DiffWorkspace leftNode={leftNode} rightNode={rightNode} />
            </div>
          </div>
        ) : (
          <div className={styles.workspace}>
            {openPaths.length > 0 && (
              <TabBar
                paths={openPaths}
                activePath={activePath}
                dirtyPaths={dirtyPaths}
                onActivate={setActivePath}
                onClose={handleRequestClose}
              />
            )}
            <div className={styles.content}>
              {openPaths.length === 0 ? (
                <div className={styles.placeholder}>
                  <h2>テーブル定義を選択</h2>
                  <p>左のパネルから *.table.json ファイルを選択してください。</p>
                </div>
              ) : (
                openPaths.map((path) => (
                  <div
                    key={path}
                    className={styles.panel}
                    style={{ display: path === activePath ? 'block' : 'none' }}
                  >
                    <TableDefinitionPanel
                      path={path}
                      onDirtyChange={(dirty) => updateDirty(path, dirty)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </MainLayout>

      <SettingsDialog
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onAdd={() => void handleAdd()}
        onRemove={(path) => void handleRemove(path)}
        onSetActive={(path) => void handleSetActive(path)}
      />

      <ConfirmDialog
        open={closingPath !== null}
        title="未保存の変更"
        message="未保存の変更があります。このタブを閉じますか？"
        confirmLabel="閉じる"
        cancelLabel="キャンセル"
        onConfirm={handleConfirmClose}
        onCancel={() => setClosingPath(null)}
      />
    </>
  )
}

export default App
