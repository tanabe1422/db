import { FolderPlus, Trash2, X } from 'lucide-react'
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
}

export function SettingsDialog({
  open,
  settings,
  onClose,
  onAdd,
  onRemove,
  onSetActive,
}: SettingsDialogProps) {
  if (!open) {
    return null
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
          <p className={styles.description}>
            参照ディレクトリの履歴を管理します。リストは最近使った順に表示されます。
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

          {(settings.directories ?? []).length === 0 ? (
            <p className={styles.empty}>登録されたディレクトリはありません。</p>
          ) : (
            <ul className={styles.list}>
              {(settings.directories ?? []).map((path) => {
                const isActive = path === settings.activeDirectory
                return (
                  <li
                    key={path}
                    className={`${styles.item}${isActive ? ` ${styles.active}` : ''}`}
                  >
                    <Button
                      variant="plain"
                      className={styles.select}
                      onClick={() => onSetActive(path)}
                      title={path}
                    >
                      <span className={styles.badge}>
                        {isActive ? '使用中' : '切替'}
                      </span>
                      <span className={styles.path}>{path}</span>
                    </Button>
                    <IconButton
                      variant="danger"
                      className={styles.itemDanger}
                      onClick={() => onRemove(path)}
                      aria-label="削除"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </IconButton>
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
