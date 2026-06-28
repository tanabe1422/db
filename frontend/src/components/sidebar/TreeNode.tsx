import { useState } from 'react'
import { ChevronDown, ChevronRight, File, Folder } from 'lucide-react'

import type { TreeNode as TreeNodeType } from '../../types'
import styles from './TreeNode.module.css'

interface TreeNodeProps {
  node: TreeNodeType
  depth?: number
  selectedPath?: string
  onSelect?: (path: string) => void
}

export function TreeNode({
  node,
  depth = 0,
  selectedPath,
  onSelect,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = node.children.length > 0
  const isSelected = !node.isDir && node.path === selectedPath

  if (!node.isDir) {
    return (
      <button
        type="button"
        className={`${styles.item}${isSelected ? ` ${styles.selected}` : ''}`}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={() => onSelect?.(node.path)}
        title={node.path}
      >
        <span className={styles.caret} />
        <File size={14} aria-hidden="true" className={styles.fileIcon} />
        <span className={styles.label}>{node.name}</span>
      </button>
    )
  }

  return (
    <div className={styles.branch}>
      <button
        type="button"
        className={styles.item}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={() => setExpanded((value) => !value)}
        title={node.path || node.name}
      >
        <span className={styles.caret}>
          {hasChildren ? (
            expanded ? (
              <ChevronDown size={12} aria-hidden="true" />
            ) : (
              <ChevronRight size={12} aria-hidden="true" />
            )
          ) : null}
        </span>
        <Folder size={14} aria-hidden="true" className={styles.folderIcon} />
        <span className={styles.label}>{node.name}</span>
      </button>
      {expanded &&
        hasChildren &&
        node.children.map((child) => (
          <TreeNode
            key={`${child.path || child.name}-${depth}`}
            node={child}
            depth={depth + 1}
            selectedPath={selectedPath}
            onSelect={onSelect}
          />
        ))}
    </div>
  )
}
