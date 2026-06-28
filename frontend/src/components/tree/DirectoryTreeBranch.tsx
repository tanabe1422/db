import type { ReactNode } from 'react'
import { ChevronDown, ChevronRight, Folder } from 'lucide-react'

import type { TreeNode } from '../../types'
import { useTreeExpansion } from '../../hooks/useTreeExpansion'
import { Button } from '../ui/Button'

export interface DirectoryTreeBranchStyles {
  branch: string
  caret: string
  folderIcon: string
  label: string
  row?: string
}

interface DirectoryTreeBranchProps {
  node: TreeNode
  depth: number
  paddingLeft: number
  styles: DirectoryTreeBranchStyles
  buttonClassName: string
  childFilter?: (child: TreeNode) => boolean
  renderTrailing?: (node: TreeNode) => ReactNode
  renderChild: (child: TreeNode, depth: number) => ReactNode
}

export function DirectoryTreeBranch({
  node,
  depth,
  paddingLeft,
  styles,
  buttonClassName,
  childFilter,
  renderTrailing,
  renderChild,
}: DirectoryTreeBranchProps) {
  const [expanded, setExpanded] = useTreeExpansion(depth)
  const children = node.children.filter(childFilter ?? (() => true))
  const hasChildren = children.length > 0

  const handleToggle = () => {
    if (hasChildren) {
      setExpanded((value) => !value)
    }
  }

  const mainButton = (
    <Button
      variant="plain"
      className={buttonClassName}
      style={{ paddingLeft }}
      onClick={handleToggle}
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
    </Button>
  )

  const rowContent = (
    <>
      {mainButton}
      {renderTrailing?.(node)}
    </>
  )

  return (
    <div className={styles.branch}>
      {styles.row ? (
        <div className={styles.row}>{rowContent}</div>
      ) : (
        rowContent
      )}
      {expanded && children.map((child) => renderChild(child, depth + 1))}
    </div>
  )
}
