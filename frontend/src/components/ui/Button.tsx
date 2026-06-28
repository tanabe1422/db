import type { ButtonHTMLAttributes } from 'react'

import { cx } from '../../utils/cx'
import styles from './Button.module.css'

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'plain'

const BUTTON_CLASS: Record<ButtonVariant, string> = {
  primary: styles.button,
  ghost: styles.ghost,
  danger: styles.danger,
  plain: styles.plain,
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function Button({
  variant = 'primary',
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={cx(BUTTON_CLASS[variant], className)} {...rest} />
  )
}

type IconButtonVariant = 'primary' | 'ghost' | 'danger' | 'plain'
type IconButtonSize = 'md' | 'sm'

const ICON_BUTTON_CLASS: Record<
  IconButtonVariant,
  Record<IconButtonSize, string>
> = {
  primary: { md: styles.icon, sm: styles.icon },
  ghost: { md: styles.ghostIcon, sm: styles.ghostIconSm },
  danger: { md: styles.dangerIcon, sm: styles.dangerIcon },
  plain: { md: styles.plainIcon, sm: styles.plainIconSm },
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant
  size?: IconButtonSize
}

export function IconButton({
  variant = 'ghost',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cx(ICON_BUTTON_CLASS[variant][size], className)}
      {...rest}
    />
  )
}
