import { Button } from './Button'
import { DialogBody, DialogFooter, DialogShell, dialogStyles } from './DialogShell'

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
  return (
    <DialogShell
      open={open}
      labelledBy="external-file-change-title"
      onBackdropClick={onCancel}
    >
      <DialogBody>
        <h2 id="external-file-change-title" className={dialogStyles.title}>
          ファイルが変更されました
        </h2>
        <p className={dialogStyles.message}>
          「{fileName}」がディスク上で変更されています。未保存の変更があります。
        </p>
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>
          キャンセル
        </Button>
        <Button variant="secondary" onClick={onIgnore}>
          無視
        </Button>
        <Button variant="danger" onClick={onReload}>
          再読み込み
        </Button>
      </DialogFooter>
    </DialogShell>
  )
}
