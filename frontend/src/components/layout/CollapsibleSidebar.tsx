import { PanelLeft } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

import { cx } from '../../utils/cx'
import { IconButton } from '../ui/Button'
import { SidebarContext } from './sidebarContext'
import styles from './CollapsibleSidebar.module.css'

const STORAGE_KEY = 'db-gui.sidebarCollapsed'
const STORAGE_KEY_WIDTH = 'db-gui.sidebarWidth'
const DEFAULT_WIDTH = 280
const MIN_WIDTH = 200
const MAX_WIDTH = 560

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
  } catch {
    // ignore
  }
}

function readWidth(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WIDTH)
    if (!raw) return DEFAULT_WIDTH
    const value = Number(raw)
    if (!Number.isFinite(value)) return DEFAULT_WIDTH
    return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value))
  } catch {
    return DEFAULT_WIDTH
  }
}

function writeWidth(width: number) {
  try {
    localStorage.setItem(STORAGE_KEY_WIDTH, String(width))
  } catch {
    // ignore
  }
}

function clampWidth(width: number) {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width))
}

interface CollapsibleSidebarProps {
  children: ReactNode
}

export function CollapsibleSidebar({ children }: CollapsibleSidebarProps) {
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [width, setWidth] = useState(readWidth)
  const [resizing, setResizing] = useState(false)
  const widthRef = useRef(width)

  useEffect(() => {
    widthRef.current = width
  }, [width])

  useEffect(() => {
    writeCollapsed(collapsed)
  }, [collapsed])

  const expand = useCallback(() => setCollapsed(false), [])
  const collapse = useCallback(() => setCollapsed(true), [])

  const handleResizeStart = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (collapsed) return

      event.preventDefault()
      const startX = event.clientX
      const startWidth = widthRef.current

      setResizing(true)

      const onMove = (moveEvent: PointerEvent) => {
        const nextWidth = clampWidth(startWidth + moveEvent.clientX - startX)
        widthRef.current = nextWidth
        setWidth(nextWidth)
      }

      const onUp = () => {
        setResizing(false)
        writeWidth(widthRef.current)
        document.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerup', onUp)
      }

      document.addEventListener('pointermove', onMove)
      document.addEventListener('pointerup', onUp)
    },
    [collapsed],
  )

  const contextValue = useMemo(
    () => ({ collapsed, collapse, expand }),
    [collapsed, collapse, expand],
  )

  const wrapperStyle = {
    '--sidebar-width': `${width}px`,
  } as CSSProperties

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        className={cx(
          styles.wrapper,
          collapsed && styles.wrapperCollapsed,
          resizing && styles.wrapperResizing,
        )}
        style={wrapperStyle}
        data-collapsed={collapsed || undefined}
      >
        <div className={styles.content} hidden={collapsed}>
          {children}
        </div>
        {!collapsed && (
          <div
            className={styles.resizeHandle}
            onPointerDown={handleResizeStart}
            role="separator"
            aria-orientation="vertical"
            aria-label="サイドパネルの幅を調整"
          />
        )}
        {collapsed && (
          <div className={styles.rail}>
            <IconButton
              className={styles.railToggle}
              onClick={expand}
              aria-label="サイドパネルを開く"
              title="サイドパネルを開く"
            >
              <PanelLeft size={16} aria-hidden="true" />
            </IconButton>
          </div>
        )}
      </div>
    </SidebarContext.Provider>
  )
}
