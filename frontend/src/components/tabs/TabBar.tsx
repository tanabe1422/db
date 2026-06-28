import { X } from 'lucide-react'

import { cx } from '../../utils/cx'
import { IconButton } from '../ui/Button'
import styles from './TabBar.module.css'

interface TabBarProps {
  paths: string[]
  activePath: string
  dirtyPaths: Set<string>
  onActivate: (path: string) => void
  onClose: (path: string) => void
}

function baseName(path: string): string {
  const parts = path.split(/[\\/]/)
  return parts[parts.length - 1] || path
}

export function TabBar({
  paths,
  activePath,
  dirtyPaths,
  onActivate,
  onClose,
}: TabBarProps) {
  return (
    <div className={styles.bar} role="tablist">
      {paths.map((path) => {
        const isActive = path === activePath
        const isDirty = dirtyPaths.has(path)
        return (
          <div
            key={path}
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab}${isActive ? ` ${styles.active}` : ''}`}
            title={path}
            onClick={() => onActivate(path)}
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
        )
      })}
    </div>
  )
}
