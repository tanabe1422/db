import type { ButtonHTMLAttributes } from 'react'

import { cx } from '../../utils/cx'
import { Tooltip } from './Tooltip'
import styles from './Button.module.css'

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'plain'
  | 'menuItem'
  | 'listOption'

const BUTTON_CLASS: Record<ButtonVariant, string> = {
  primary: styles.button,
  secondary: styles.secondary,
  ghost: styles.ghost,
  danger: styles.danger,
  plain: styles.plain,
  menuItem: styles.menuItem,
  listOption: styles.listOption,
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  tooltip?: string
  tooltipWrap?: boolean
}

export function Button({
  variant = 'primary',
  className,
  type = 'button',
  tooltip,
  tooltipWrap,
  title,
  ...rest
}: ButtonProps) {
  const button = (
    <button
      type={type}
      className={cx(BUTTON_CLASS[variant], className)}
      title={tooltip ? undefined : title}
      {...rest}
    />
  )
  if (tooltip) {
    return (
      <Tooltip content={tooltip} wrap={tooltipWrap}>
        {button}
      </Tooltip>
    )
  }
  return button
}

type IconButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'plain'
  | 'active'
  | 'comboboxToggle'
type IconButtonSize = 'md' | 'sm'

const ICON_BUTTON_CLASS: Record<
  IconButtonVariant,
  Record<IconButtonSize, string>
> = {
  primary: { md: styles.icon, sm: styles.icon },
  secondary: { md: styles.secondaryIcon, sm: styles.secondaryIconSm },
  ghost: { md: styles.ghostIcon, sm: styles.ghostIconSm },
  danger: { md: styles.dangerIcon, sm: styles.dangerIconSm },
  plain: { md: styles.plainIcon, sm: styles.plainIconSm },
  active: { md: styles.activeIcon, sm: styles.activeIconSm },
  comboboxToggle: { md: styles.comboboxToggle, sm: styles.comboboxToggle },
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant
  size?: IconButtonSize
  tooltip?: string
  tooltipWrap?: boolean
}

export function IconButton({
  variant = 'ghost',
  size = 'md',
  className,
  type = 'button',
  tooltip,
  tooltipWrap,
  title,
  ...rest
}: IconButtonProps) {
  const button = (
    <button
      type={type}
      className={cx(ICON_BUTTON_CLASS[variant][size], className)}
      title={tooltip ? undefined : title}
      {...rest}
    />
  )
  if (tooltip) {
    return (
      <Tooltip content={tooltip} wrap={tooltipWrap}>
        {button}
      </Tooltip>
    )
  }
  return button
}
