import { Check, ChevronDown, ChevronUp, FolderPlus, Trash2, X } from 'lucide-react'
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
}

export function SettingsDialog({
  open,
  settings,
  onClose,
  onAdd,
  onRemove,
  onSetActive,
  onMove,
}: SettingsDialogProps) {
  if (!open) {
    return null
  }

  const directories = settings.directories ?? []

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
          <p className={styles.description}>
            参照ディレクトリの履歴を管理します。
          </p>
          <div className={styles.actions}>
            <IconButton
              variant="primary"
              onClick={onAdd}
              aria-label="ディレクトリを追加"
            >
              <FolderPlus size={16} aria-hidden="true" />
            </IconButton>
          </div>

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
                      title={path}
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
        </div>
      </div>
    </div>
  )
}
