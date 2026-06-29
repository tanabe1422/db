import {
  ChevronDown,
  GitBranch,
  GitCompare,
  PencilLine,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { toFixedOverlayRect } from '../../lib/appZoom'
import { cx } from '../../utils/cx'
import { SIDEBAR_COMPACT_WIDTH, useSidebar } from '../layout/sidebarContext'
import { IconButton } from '../ui/Button'
import styles from './SidebarModeSwitcher.module.css'

export type SidebarMode = 'edit' | 'diff' | 'git-diff'

interface ModeOption {
  id: SidebarMode
  label: string
  icon: LucideIcon
  disabled?: boolean
}

const MODE_OPTIONS: Omit<ModeOption, 'disabled'>[] = [
  { id: 'edit', label: '編集', icon: PencilLine },
  { id: 'diff', label: 'フォルダ比較', icon: GitCompare },
  { id: 'git-diff', label: 'Git 履歴比較', icon: GitBranch },
]

interface SidebarModeSwitcherProps {
  mode: SidebarMode
  hasDirectory: boolean
  onModeChange: (mode: SidebarMode) => void
  vertical?: boolean
}

export function SidebarModeSwitcher({
  mode,
  hasDirectory,
  onModeChange,
  vertical = false,
}: SidebarModeSwitcherProps) {
  const { width: sidebarWidth } = useSidebar()
  const compact = !vertical && sidebarWidth <= SIDEBAR_COMPACT_WIDTH
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<{
    top: number
    left: number
  } | null>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const options: ModeOption[] = MODE_OPTIONS.map((option) => ({
    ...option,
    disabled: option.id !== 'edit' && !hasDirectory,
  }))

  const activeOption = options.find((option) => option.id === mode) ?? options[0]
  const otherOptions = options.filter((option) => option.id !== mode)
  const ActiveIcon = activeOption.icon

  const openMenu = () => {
    const anchor = anchorRef.current
    if (!anchor) return

    const overlay = toFixedOverlayRect(anchor.getBoundingClientRect(), 4)
    setMenuStyle({
      top: overlay.top,
      left: overlay.left,
    })
    setMenuOpen(true)
  }

  useEffect(() => {
    if (!menuOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (anchorRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return
      }
      setMenuOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [menuOpen])

  useEffect(() => {
    setMenuOpen(false)
  }, [mode, compact])

  return (
    <div
      className={cx(styles.switcher, vertical && styles.switcherVertical)}
      role="group"
      aria-label="表示モード"
    >
      {(vertical || !compact) && (
        <div className={cx(styles.full, vertical && styles.fullVertical)}>
          {options.map((option) => {
            const Icon = option.icon
            return (
              <IconButton
                key={option.id}
                className={cx(mode === option.id && styles.modeActive)}
                onClick={() => onModeChange(option.id)}
                disabled={option.disabled}
                aria-label={option.label}
                tooltip={option.label}
                aria-pressed={mode === option.id}
              >
                <Icon size={16} aria-hidden="true" />
              </IconButton>
            )
          })}
        </div>
      )}

      {compact && (
        <div className={styles.compact} ref={anchorRef}>
          <span
            className={cx(styles.activeMode, styles.modeActive)}
            aria-label={activeOption.label}
            title={activeOption.label}
          >
            <ActiveIcon size={16} aria-hidden="true" />
          </span>
          <IconButton
            className={styles.menuToggle}
            onClick={() => (menuOpen ? setMenuOpen(false) : openMenu())}
            aria-label="表示モードを切り替え"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <ChevronDown size={16} aria-hidden="true" />
          </IconButton>
          {menuOpen &&
            menuStyle &&
            createPortal(
              <div
                ref={menuRef}
                className={styles.menu}
                role="menu"
                style={{
                  top: menuStyle.top,
                  left: menuStyle.left,
                }}
              >
                {otherOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="menuitem"
                      className={styles.menuItem}
                      disabled={option.disabled}
                      onClick={() => onModeChange(option.id)}
                    >
                      <Icon size={16} aria-hidden="true" />
                      <span>{option.label}</span>
                    </button>
                  )
                })}
              </div>,
              document.body,
            )}
        </div>
      )}
    </div>
  )
}
