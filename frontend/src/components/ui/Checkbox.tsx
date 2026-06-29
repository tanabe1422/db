import type { HTMLAttributes, KeyboardEvent } from 'react'

import { cx } from '../../utils/cx'
import styles from './Checkbox.module.css'

interface CheckboxProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'onChange'> {
  checked: boolean
  readOnly?: boolean
  disabled?: boolean
  onChange?: (checked: boolean) => void
}

export function Checkbox({
  checked,
  readOnly = false,
  disabled = false,
  className,
  onChange,
  onClick,
  onKeyDown,
  tabIndex,
  ...rest
}: CheckboxProps) {
  const isInteractive = !readOnly && !disabled

  function handleKeyDown(e: KeyboardEvent<HTMLSpanElement>) {
    onKeyDown?.(e)
    if (e.defaultPrevented || !isInteractive) return
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      onChange?.(!checked)
    }
  }

  return (
    <span
      role="checkbox"
      aria-checked={checked}
      aria-readonly={readOnly || undefined}
      aria-disabled={disabled || undefined}
      tabIndex={tabIndex ?? (isInteractive ? 0 : -1)}
      className={cx(
        styles.root,
        readOnly && styles.readOnly,
        disabled && styles.disabled,
        className,
      )}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || !isInteractive) return
        onChange?.(!checked)
      }}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      <span
        className={cx(styles.box, checked && styles.checked)}
        aria-hidden
      />
    </span>
  )
}
