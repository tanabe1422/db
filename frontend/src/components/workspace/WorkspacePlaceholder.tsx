import type { ReactNode } from 'react'

import styles from '../../App.module.css'

interface WorkspacePlaceholderProps {
  title?: string
  message?: ReactNode
  path?: string
  children?: ReactNode
}

export function WorkspacePlaceholder({
  title,
  message,
  path,
  children,
}: WorkspacePlaceholderProps) {
  return (
    <div className={styles.placeholder}>
      {title && <h2>{title}</h2>}
      {path && <p className={styles.path}>{path}</p>}
      {children}
      {message != null && <p>{message}</p>}
    </div>
  )
}
