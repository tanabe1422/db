import { Check, ChevronDown, ChevronUp, FolderPlus, Sparkles, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import type { AISetupResult } from '../../lib/wails'
import { errorMessage } from '../../lib/errorMessage'
import { initAISetup } from '../../lib/wails'
import type { Settings } from '../../types'
import { Button, IconButton } from '../ui/Button'
import styles from './SettingsDialog.module.css'

interface SettingsDialogProps {
  open: boolean
  settings: Settings
  onClose: () => void
  onAdd: () => void
  onRemove: (path: string) => void
  onSetActive: (path: string) => void
  onMove: (path: string, offset: -1 | 1) => void
  onAISetupComplete?: () => void
}

function formatSetupResult(result: AISetupResult): string {
  const parts: string[] = []
  if (result.schemaWritten) parts.push('schema を配置')
  if (result.cursorRuleWritten) parts.push('Cursor Rule を配置')
  if (result.claudeMdWritten) parts.push('CLAUDE.md を配置')
  if (result.vscodeSettingsWritten) parts.push('VS Code 設定を更新')
  if (result.tableJsonPatched > 0) {
    parts.push(`$schema を ${result.tableJsonPatched} 件付与`)
  }
  if (result.tableJsonFailed > 0) {
    parts.push(`${result.tableJsonFailed} 件スキップ（JSON 不正など）`)
  }
  if (parts.length === 0) {
    return '変更なし（すでにセットアップ済みです）'
  }
  const summary = parts.join('、')
  const warnings = result.warnings ?? []
  if (warnings.length === 0) {
    return summary
  }
  return `${summary}\n${warnings.join('\n')}`
}

export function SettingsDialog({
  open,
  settings,
  onClose,
  onAdd,
  onRemove,
  onSetActive,
  onMove,
  onAISetupComplete,
}: SettingsDialogProps) {
  const [setupMessage, setSetupMessage] = useState<string | null>(null)
  const [setupError, setSetupError] = useState<string | null>(null)
  const [setupLoading, setSetupLoading] = useState(false)

  if (!open) {
    return null
  }

  const directories = settings.directories ?? []
  const activeDirectory = settings.activeDirectory ?? ''

  const handleInitAISetup = async () => {
    if (!activeDirectory) {
      return
    }
    setSetupLoading(true)
    setSetupMessage(null)
    setSetupError(null)
    try {
      const result = await initAISetup(activeDirectory)
      setSetupMessage(formatSetupResult(result))
      onAISetupComplete?.()
    } catch (err) {
      setSetupError(errorMessage(err, 'セットアップに失敗しました'))
    } finally {
      setSetupLoading(false)
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="settings-title">参照ディレクトリ設定</h2>
          <IconButton onClick={onClose} aria-label="閉じる">
            <X size={16} aria-hidden="true" />
          </IconButton>
        </div>

        <div className={styles.body}>
          {directories.length === 0 ? (
            <p className={styles.empty}>登録されたディレクトリはありません。</p>
          ) : (
            <ul className={styles.list}>
              {directories.map((path, index) => {
                const isActive = path === settings.activeDirectory
                return (
                  <li
                    key={path}
                    className={`${styles.item}${isActive ? ` ${styles.active}` : ''}`}
                  >
                    <span className={styles.check} aria-hidden="true">
                      {isActive ? <Check size={14} /> : null}
                    </span>
                    <Button
                      variant="plain"
                      className={styles.select}
                      onClick={() => onSetActive(path)}
                      tooltip={path}
                      tooltipWrap
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <span className={styles.path}>{path}</span>
                    </Button>
                    <div className={styles.itemActions}>
                      <IconButton
                        size="sm"
                        onClick={() => onMove(path, -1)}
                        disabled={index === 0}
                        aria-label="上へ移動"
                      >
                        <ChevronUp size={14} aria-hidden="true" />
                      </IconButton>
                      <IconButton
                        size="sm"
                        onClick={() => onMove(path, 1)}
                        disabled={index === directories.length - 1}
                        aria-label="下へ移動"
                      >
                        <ChevronDown size={14} aria-hidden="true" />
                      </IconButton>
                      <IconButton
                        className={styles.delete}
                        size="sm"
                        onClick={() => onRemove(path)}
                        aria-label="削除"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </IconButton>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <section className={styles.aiSetup}>
            <h3 className={styles.aiSetupTitle}>AI / Cursor 向けセットアップ</h3>
            <p className={styles.aiSetupDesc}>
              schema・Cursor Rule・CLAUDE.md・$schema 参照をアクティブディレクトリに配置します。
            </p>
            <Button
              variant="secondary"
              onClick={() => void handleInitAISetup()}
              disabled={!activeDirectory || setupLoading}
            >
              <Sparkles size={14} aria-hidden="true" />
              {setupLoading ? '実行中…' : 'セットアップを実行'}
            </Button>
            {setupMessage ? (
              <p className={styles.aiSetupMessage}>{setupMessage}</p>
            ) : null}
            {setupError ? (
              <p className={styles.aiSetupError}>{setupError}</p>
            ) : null}
          </section>

          <div className={styles.footer}>
            <IconButton
              variant="secondary"
              onClick={onAdd}
              aria-label="ディレクトリを追加"
            >
              <FolderPlus size={16} aria-hidden="true" />
            </IconButton>
            <Button onClick={onClose}>OK</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
