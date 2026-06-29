import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { toFixedOverlayRect, ZOOM_CHANGE_EVENT } from '../../lib/appZoom'
import { cx } from '../../utils/cx'
import styles from './TableDefinitionView.module.css'

function ComboboxChevron({ open }: { open?: boolean }) {
  return (
    <svg
      className={cx(styles.cellComboboxIcon, open && styles.cellComboboxIconOpen)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

interface DataTypeComboboxProps {
  value: string
  onChange: (value: string) => void
  inputRef: React.MutableRefObject<HTMLInputElement | null>
  suggestions: readonly string[]
  requestOpenOnMount?: () => boolean
}

export function DataTypeCombobox({
  value,
  onChange,
  inputRef,
  suggestions,
  requestOpenOnMount,
}: DataTypeComboboxProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })

  const updatePosition = () => {
    const el = wrapperRef.current
    if (!el) {
      return
    }
    const cell = el.closest('td')
    const rect = (cell ?? el).getBoundingClientRect()
    setPosition(toFixedOverlayRect(rect))
  }

  useLayoutEffect(() => {
    if (!requestOpenOnMount?.()) {
      return
    }
    updatePosition()
    setOpen(true)
  }, [requestOpenOnMount])

  useLayoutEffect(() => {
    if (!open) {
      return
    }
    updatePosition()
    const onScrollOrResize = () => updatePosition()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    window.addEventListener(ZOOM_CHANGE_EVENT, onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener(ZOOM_CHANGE_EVENT, onScrollOrResize)
    }
  }, [open, value])

  useEffect(() => {
    if (!open) {
      return
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (wrapperRef.current?.contains(target)) {
        return
      }
      const list = document.getElementById('data-type-suggestion-list')
      if (list?.contains(target)) {
        return
      }
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const selectSuggestion = (next: string) => {
    onChange(next)
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className={styles.cellCombobox} ref={wrapperRef}>
      <input
        ref={(el) => {
          inputRef.current = el
        }}
        className={styles.cellComboboxInput}
        value={value}
        onChange={(ev) => onChange(ev.target.value)}
      />
      <button
        type="button"
        className={styles.cellComboboxToggle}
        tabIndex={-1}
        aria-label="型の候補を表示"
        aria-expanded={open}
        onMouseDown={(ev) => ev.preventDefault()}
        onClick={() => {
          updatePosition()
          setOpen((current) => !current)
          inputRef.current?.focus()
        }}
      >
        <ComboboxChevron open={open} />
      </button>
      {open &&
        suggestions.length > 0 &&
        createPortal(
          <ul
            id="data-type-suggestion-list"
            className={styles.cellComboboxList}
            role="listbox"
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
              minWidth: position.width,
            }}
          >
            {suggestions.map((item) => (
              <li key={item} role="option">
                <button
                  type="button"
                  className={styles.cellComboboxOption}
                  onMouseDown={(ev) => ev.preventDefault()}
                  onClick={() => selectSuggestion(item)}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  )
}

export function DataTypeComboboxDisplay({
  value,
  onOpenList,
}: {
  value: string
  onOpenList: () => void
}) {
  return (
    <span className={styles.cellComboboxDisplay}>
      <span className={styles.cellText}>{value}</span>
      <button
        type="button"
        className={styles.cellComboboxToggle}
        tabIndex={-1}
        aria-label="型の候補を表示"
        onMouseDown={(ev) => ev.preventDefault()}
        onClick={(ev) => {
          ev.stopPropagation()
          onOpenList()
        }}
      >
        <ComboboxChevron />
      </button>
    </span>
  )
}
