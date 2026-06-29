import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

import { relPathWithinRoot } from '../../utils/relPathWithinRoot'
import { cx } from '../../utils/cx'
import { ContextMenu } from '../ui/ContextMenu'
import { IconButton } from '../ui/Button'
import { Tooltip } from '../ui/Tooltip'
import styles from './TabBar.module.css'

interface TabBarProps {
  paths: string[]
  activePath: string
  dirtyPaths: Set<string>
  activeDirectory: string
  onActivate: (path: string) => void
  onClose: (path: string) => void
  onCloseAllSaved: () => void
}

function baseName(path: string): string {
  const parts = path.split(/[\\/]/)
  return parts[parts.length - 1] || path
}

export function TabBar({
  paths,
  activePath,
  dirtyPaths,
  activeDirectory,
  onActivate,
  onClose,
  onCloseAllSaved,
}: TabBarProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef(new Map<string, HTMLDivElement>())
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)

  const savedCount = paths.filter((path) => !dirtyPaths.has(path)).length

  useEffect(() => {
    if (!activePath) {
      return
    }

    const bar = barRef.current
    const tab = tabRefs.current.get(activePath)
    if (!bar || !tab) {
      return
    }

    requestAnimationFrame(() => {
      const currentBar = barRef.current
      const currentTab = tabRefs.current.get(activePath)
      if (!currentBar || !currentTab) {
        return
      }

      const barRect = currentBar.getBoundingClientRect()
      const tabRect = currentTab.getBoundingClientRect()
      const leftClipped = tabRect.left < barRect.left - 0.5
      const notAtLeftEdge = tabRect.left > barRect.left + 0.5

      if (leftClipped || notAtLeftEdge) {
        currentBar.scrollLeft = currentTab.offsetLeft
      }
    })
  }, [activePath, paths])

  useEffect(() => {
    const el = barRef.current
    if (!el) {
      return
    }

    function handleWheel(event: WheelEvent) {
      const bar = barRef.current
      if (!bar || bar.scrollWidth <= bar.clientWidth) {
        return
      }
      event.preventDefault()
      bar.scrollLeft += event.deltaY
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [paths.length])

  function openContextMenu(event: React.MouseEvent) {
    event.preventDefault()
    setMenu({ x: event.clientX, y: event.clientY })
  }

  return (
    <>
      <div ref={barRef} className={styles.bar} role="tablist">
        {paths.map((path) => {
          const isActive = path === activePath
          const isDirty = dirtyPaths.has(path)
          const tooltip = relPathWithinRoot(activeDirectory, path) || baseName(path)
          return (
            <Tooltip key={path} content={tooltip} wrap>
              <div
                ref={(element) => {
                  if (element) {
                    tabRefs.current.set(path, element)
                  } else {
                    tabRefs.current.delete(path)
                  }
                }}
                role="tab"
                aria-selected={isActive}
                className={`${styles.tab}${isActive ? ` ${styles.active}` : ''}`}
                onClick={() => onActivate(path)}
                onContextMenu={openContextMenu}
                onMouseDown={(event) => {
                  if (event.button === 1) {
                    event.preventDefault()
                    onClose(path)
                  }
                }}
              >
              <span className={styles.label}>{baseName(path)}</span>
              <IconButton
                variant="plain"
                size="sm"
                className={cx(styles.close, isDirty && styles.dirty)}
                aria-label="閉じる"
                onClick={(event) => {
                  event.stopPropagation()
                  onClose(path)
                }}
              >
                <span className={styles.dot} aria-hidden="true" />
                <X size={14} aria-hidden="true" className={styles.closeIcon} />
              </IconButton>
            </div>
            </Tooltip>
          )
        })}
      </div>
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={[
            {
              label: '保存済をすべて閉じる',
              disabled: savedCount === 0,
              onClick: onCloseAllSaved,
            },
          ]}
          onClose={() => setMenu(null)}
        />
      )}
    </>
  )
}
