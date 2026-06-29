import type { MouseEvent } from 'react'
import { Database, File, FileJson, Sheet } from 'lucide-react'

import type { TreeNode as TreeNodeType } from '../../types'
import { cx } from '../../utils/cx'
import { treeNodeTooltip } from '../../utils/relPathWithinRoot'
import { getTreeFileKind } from '../../utils/treeFileKind'
import { Button } from '../ui/Button'

import { DirectoryTreeBranch } from '../tree/DirectoryTreeBranch'
import styles from './TreeNode.module.css'

interface TreeNodeProps {
  node: TreeNodeType
  rootDirectory: string
  depth?: number
  selectedPath?: string
  onSelect?: (path: string) => void
  onNodeContextMenu?: (node: TreeNodeType, event: MouseEvent) => void
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

function TreeFileIcon({ name }: { name: string }) {
  const iconProps = { size: 14, 'aria-hidden': true as const }
  switch (getTreeFileKind(name)) {
    case 'table-json':
      return <FileJson {...iconProps} className={styles.tableJsonIcon} />
    case 'sql':
      return <Database {...iconProps} className={styles.sqlIcon} />
    case 'xlsx':
      return <Sheet {...iconProps} className={styles.xlsxIcon} />
    default:
      return <File {...iconProps} className={styles.fileIcon} />
  }
}

export function TreeNode({
  node,
  rootDirectory,
  depth = 0,
  selectedPath,
  onSelect,
  onNodeContextMenu,
}: TreeNodeProps) {
  function renderChild(child: TreeNodeType, childDepth: number) {
    return (
      <TreeNode
        key={`${child.path || child.name}-${childDepth}`}
        node={child}
        rootDirectory={rootDirectory}
        depth={childDepth}
        selectedPath={selectedPath}
        onSelect={onSelect}
        onNodeContextMenu={onNodeContextMenu}
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
        onContextMenu={
          onNodeContextMenu
            ? (event) => onNodeContextMenu(node, event)
            : undefined
        }
        tooltip={treeNodeTooltip(rootDirectory, node)}
        tooltipWrap
      >
        <span className={styles.caret} />
        <TreeFileIcon name={node.name} />
        <span className={styles.label}>{node.name}</span>
      </Button>
    )
  }

  return (
    <DirectoryTreeBranch
      node={node}
      rootDirectory={rootDirectory}
      depth={depth}
      paddingLeft={sidebarPadding(depth)}
      styles={branchStyles}
      buttonClassName={styles.item}
      renderChild={renderChild}
      onNodeContextMenu={onNodeContextMenu}
    />
  )
}
