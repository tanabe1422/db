import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { toContextMenuPosition } from '../../lib/appZoom'
import styles from './ContextMenu.module.css'

export interface ContextMenuItem {
  type?: 'item'
  label: string
  onClick: () => void
  disabled?: boolean
}

export interface ContextMenuSeparator {
  type: 'separator'
}

export type ContextMenuEntry = ContextMenuItem | ContextMenuSeparator

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuEntry[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const { x: left, y: top } = toContextMenuPosition(x, y)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current?.contains(event.target as Node)) {
        return
      }
      onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [onClose])

  return createPortal(
    <div
      ref={menuRef}
      className={styles.menu}
      style={{ left, top }}
      role="menu"
    >
      {items.map((entry, index) => {
        if (entry.type === 'separator') {
          return (
            <div
              key={`sep-${index}`}
              className={styles.separator}
              role="separator"
            />
          )
        }

        return (
          <button
            key={entry.label}
            type="button"
            role="menuitem"
            className={styles.item}
            disabled={entry.disabled}
            onClick={() => {
              entry.onClick()
              onClose()
            }}
          >
            {entry.label}
          </button>
        )
      })}
    </div>,
    document.body,
  )
}
