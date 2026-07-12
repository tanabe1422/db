import { useEffect, useRef } from 'react'

import { Button } from './Button'
import { DialogBody, DialogFooter, DialogShell, dialogStyles } from './DialogShell'

interface PromptDialogProps {
  open: boolean
  title: string
  label?: string
  defaultValue?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: (value: string) => void
  onCancel: () => void
}

export function PromptDialog({
  open,
  title,
  label,
  defaultValue = '',
  confirmLabel = 'OK',
  cancelLabel = 'キャンセル',
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [open, defaultValue])

  function handleSubmit() {
    onConfirm(inputRef.current?.value ?? '')
  }

  return (
    <DialogShell open={open} labelledBy="prompt-title" onBackdropClick={onCancel}>
      <DialogBody>
        <h2 id="prompt-title" className={dialogStyles.title}>
          {title}
        </h2>
        {label && <p className={dialogStyles.message}>{label}</p>}
        <input
          ref={inputRef}
          className={dialogStyles.input}
          type="text"
          defaultValue={defaultValue}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              handleSubmit()
            }
          }}
        />
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button onClick={handleSubmit}>{confirmLabel}</Button>
      </DialogFooter>
    </DialogShell>
  )
}
