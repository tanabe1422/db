import { File } from 'lucide-react'

import type { TreeNode as TreeNodeType } from '../../types'
import { cx } from '../../utils/cx'
import { Button } from '../ui/Button'

import { DirectoryTreeBranch } from '../tree/DirectoryTreeBranch'
import styles from './TreeNode.module.css'

interface TreeNodeProps {
  node: TreeNodeType
  depth?: number
  selectedPath?: string
  onSelect?: (path: string) => void
}

const branchStyles = {
  branch: styles.branch,
  caret: styles.caret,
  folderIcon: styles.folderIcon,
  label: styles.label,
}

function sidebarPadding(depth: number) {
  return depth * 16 + 12
}

export function TreeNode({
  node,
  depth = 0,
  selectedPath,
  onSelect,
}: TreeNodeProps) {
  function renderChild(child: TreeNodeType, childDepth: number) {
    return (
      <TreeNode
        key={`${child.path || child.name}-${childDepth}`}
        node={child}
        depth={childDepth}
        selectedPath={selectedPath}
        onSelect={onSelect}
      />
    )
  }

  if (!node.isDir) {
    const isSelected = node.path === selectedPath
    return (
      <Button
        variant="plain"
        className={cx(styles.item, isSelected && styles.selected)}
        style={{ paddingLeft: `${sidebarPadding(depth)}px` }}
        onClick={() => onSelect?.(node.path)}
        title={node.path}
      >
        <span className={styles.caret} />
        <File size={14} aria-hidden="true" className={styles.fileIcon} />
        <span className={styles.label}>{node.name}</span>
      </Button>
    )
  }

  return (
    <DirectoryTreeBranch
      node={node}
      depth={depth}
      paddingLeft={sidebarPadding(depth)}
      styles={branchStyles}
      buttonClassName={styles.item}
      renderChild={renderChild}
    />
  )
}
