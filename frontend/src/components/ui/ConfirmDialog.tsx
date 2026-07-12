import { Button } from './Button'
import { DialogBody, DialogFooter, DialogShell, dialogStyles } from './DialogShell'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'キャンセル',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <DialogShell open={open} labelledBy="confirm-title" onBackdropClick={onCancel}>
      <DialogBody>
        <h2 id="confirm-title" className={dialogStyles.title}>
          {title}
        </h2>
        <p className={dialogStyles.message}>{message}</p>
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </DialogShell>
  )
}
