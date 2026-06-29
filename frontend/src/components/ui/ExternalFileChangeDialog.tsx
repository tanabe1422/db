import { Button } from './Button'
import styles from './ConfirmDialog.module.css'

interface ExternalFileChangeDialogProps {
  open: boolean
  fileName: string
  onReload: () => void
  onIgnore: () => void
  onCancel: () => void
}

export function ExternalFileChangeDialog({
  open,
  fileName,
  onReload,
  onIgnore,
  onCancel,
}: ExternalFileChangeDialogProps) {
  if (!open) {
    return null
  }

  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="external-file-change-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.body}>
          <h2 id="external-file-change-title" className={styles.title}>
            ファイルが変更されました
          </h2>
          <p className={styles.message}>
            「{fileName}」がディスク上で変更されています。未保存の変更があります。
          </p>
        </div>
        <div className={styles.footer}>
          <Button variant="ghost" onClick={onCancel}>
            キャンセル
          </Button>
          <Button variant="secondary" onClick={onIgnore}>
            無視
          </Button>
          <Button variant="danger" onClick={onReload}>
            再読み込み
          </Button>
        </div>
      </div>
    </div>
  )
}
