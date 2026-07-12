import type { MouseEvent } from 'react'

import type { TreeNode } from '../../types'
import { useTreeContextMenu } from '../../hooks/useTreeContextMenu'
import { relPathWithinRoot } from '../../utils/relPathWithinRoot'
import { truncateMiddle } from '../../utils/truncateMiddle'
import { ContextMenu } from '../ui/ContextMenu'
import { Tooltip } from '../ui/Tooltip'

import { DirectoryTreeBranch } from '../tree/DirectoryTreeBranch'
import { DiffSideAssignButtons } from './DiffSideAssignButtons'
import { DiffSideMark } from './DiffSideMark'
import styles from './DiffSetupPanel.module.css'

interface DiffSetupPanelProps {
  activeDirectory: string
  tree: TreeNode | null
  leftPath?: string
  rightPath?: string
  onSelectLeft: (node: TreeNode) => void
  onSelectRight: (node: TreeNode) => void
}

const branchStyles = {
  branch: styles.branch,
  caret: styles.caret,
  folderIcon: styles.folderIcon,
  label: styles.label,
  row: styles.row,
}

function diffPadding(depth: number) {
  return depth * 14 + 8
}

function displayRelPath(activeDirectory: string, path: string): string {
  return relPathWithinRoot(activeDirectory, path) || path.split(/[\\/]/).pop() || path
}

function DiffFolderRow({
  node,
  rootDirectory,
  depth,
  leftPath,
  rightPath,
  onSelectLeft,
  onSelectRight,
  onNodeContextMenu,
}: {
  node: TreeNode
  rootDirectory: string
  depth: number
  leftPath?: string
  rightPath?: string
  onSelectLeft: (node: TreeNode) => void
  onSelectRight: (node: TreeNode) => void
  onNodeContextMenu?: (node: TreeNode, event: MouseEvent) => void
}) {
  const isLeft = node.path === leftPath
  const isRight = node.path === rightPath

  function renderChild(child: TreeNode, childDepth: number) {
    return (
      <DiffFolderRow
        key={child.path || child.name}
        node={child}
        rootDirectory={rootDirectory}
        depth={childDepth}
        leftPath={leftPath}
        rightPath={rightPath}
        onSelectLeft={onSelectLeft}
        onSelectRight={onSelectRight}
        onNodeContextMenu={onNodeContextMenu}
      />
    )
  }

  return (
    <DirectoryTreeBranch
      node={node}
      rootDirectory={rootDirectory}
      depth={depth}
      paddingLeft={diffPadding(depth)}
      styles={branchStyles}
      buttonClassName={styles.expand}
      expansionThreshold={Infinity}
      childFilter={(child) => child.isDir}
      renderTrailing={() => (
        <DiffSideAssignButtons
          isLeft={isLeft}
          isRight={isRight}
          onSelectLeft={() => onSelectLeft(node)}
          onSelectRight={() => onSelectRight(node)}
        />
      )}
      renderChild={renderChild}
      onNodeContextMenu={onNodeContextMenu}
    />
  )
}

export function DiffSetupPanel({
  activeDirectory,
  tree,
  leftPath,
  rightPath,
  onSelectLeft,
  onSelectRight,
}: DiffSetupPanelProps) {
  const { menu, openNodeMenu, closeMenu } = useTreeContextMenu({
    activeDirectory,
    enableCreateScript: false,
    enableXlsxExport: false,
    enableXlsxImport: false,
  })

  return (
    <div className={styles.root}>
      <div className={styles.subHeader}>
        <div className={styles.selection}>
          <p className={styles.selRow}>
            <span className={styles.tagLeft} aria-hidden="true">
              <DiffSideMark side="left" />
            </span>
            <Tooltip content={leftPath ?? ''} wrap>
              <span className={styles.selValue}>
                {leftPath ? truncateMiddle(displayRelPath(activeDirectory, leftPath), 36) : '未選択'}
              </span>
            </Tooltip>
          </p>
          <p className={styles.selRow}>
            <span className={styles.tagRight} aria-hidden="true">
              <DiffSideMark side="right" />
            </span>
            <Tooltip content={rightPath ?? ''} wrap>
              <span className={styles.selValue}>
                {rightPath ? truncateMiddle(displayRelPath(activeDirectory, rightPath), 36) : '未選択'}
              </span>
            </Tooltip>
          </p>
        </div>
      </div>

      <div className={styles.scroll}>
        {!activeDirectory && (
          <p className={styles.empty}>
            参照ディレクトリが未設定です。上部のフォルダボタンから追加してください。
          </p>
        )}
        {activeDirectory && tree && (
          <DiffFolderRow
            node={tree}
            rootDirectory={activeDirectory}
            depth={0}
            leftPath={leftPath}
            rightPath={rightPath}
            onSelectLeft={onSelectLeft}
            onSelectRight={onSelectRight}
            onNodeContextMenu={openNodeMenu}
          />
        )}
      </div>

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menu.items}
          onClose={closeMenu}
        />
      )}
    </div>
  )
}
