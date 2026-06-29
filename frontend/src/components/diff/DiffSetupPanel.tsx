import { ArrowLeft, Download } from 'lucide-react'
import type { MouseEvent } from 'react'

import type { TreeNode } from '../../types'
import { useTreeContextMenu } from '../../hooks/useTreeContextMenu'
import { cx } from '../../utils/cx'
import { truncateMiddle } from '../../utils/truncateMiddle'
import { SidebarIconBar } from '../layout/SidebarIconBar'
import { IconButton } from '../ui/Button'
import { ContextMenu } from '../ui/ContextMenu'

import { DirectoryTreeBranch } from '../tree/DirectoryTreeBranch'
import { DiffSideMark, diffSideAriaLabel } from './DiffSideMark'
import styles from './DiffSetupPanel.module.css'

interface DiffSetupPanelProps {
  activeDirectory: string
  tree: TreeNode | null
  leftPath?: string
  rightPath?: string
  onSelectLeft: (node: TreeNode) => void
  onSelectRight: (node: TreeNode) => void
  onExitDiff: () => void
  onExportMigrateScripts?: () => void
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

function DiffFolderRow({
  node,
  depth,
  leftPath,
  rightPath,
  onSelectLeft,
  onSelectRight,
  onNodeContextMenu,
}: {
  node: TreeNode
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
      depth={depth}
      paddingLeft={diffPadding(depth)}
      styles={branchStyles}
      buttonClassName={styles.expand}
      childFilter={(child) => child.isDir}
      renderTrailing={() => (
        <span className={styles.assign}>
          <IconButton
            variant="plain"
            size="sm"
            className={cx(styles.side, isLeft && styles.sideLeftActive)}
            onClick={() => onSelectLeft(node)}
            aria-label={`${diffSideAriaLabel('left')}に指定`}
          >
            <DiffSideMark side="left" size="sm" />
          </IconButton>
          <IconButton
            variant="plain"
            size="sm"
            className={cx(styles.side, isRight && styles.sideRightActive)}
            onClick={() => onSelectRight(node)}
            aria-label={`${diffSideAriaLabel('right')}に指定`}
          >
            <DiffSideMark side="right" size="sm" />
          </IconButton>
        </span>
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
  onExitDiff,
  onExportMigrateScripts,
}: DiffSetupPanelProps) {
  const { menu, openNodeMenu, closeMenu } = useTreeContextMenu({
    activeDirectory,
    enableCreateScript: false,
    enableXlsxExport: false,
    enableXlsxImport: false,
  })

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <SidebarIconBar>
          <IconButton onClick={onExitDiff} aria-label="編集に戻る" title="編集に戻る">
            <ArrowLeft size={16} aria-hidden="true" />
          </IconButton>
          <IconButton
            onClick={onExportMigrateScripts}
            disabled={!leftPath || !rightPath}
            aria-label="変更スクリプト生成"
            title="変更スクリプト生成"
          >
            <Download size={16} aria-hidden="true" />
          </IconButton>
        </SidebarIconBar>
        <h2 className={styles.title}>フォルダ比較</h2>
        <div className={styles.selection}>
          <p className={styles.selRow}>
            <span className={styles.tagLeft} aria-hidden="true">
              <DiffSideMark side="left" />
            </span>
            <span className={styles.selValue} title={leftPath}>
              {leftPath ? truncateMiddle(leftPath, 36) : '未選択'}
            </span>
          </p>
          <p className={styles.selRow}>
            <span className={styles.tagRight} aria-hidden="true">
              <DiffSideMark side="right" />
            </span>
            <span className={styles.selValue} title={rightPath}>
              {rightPath ? truncateMiddle(rightPath, 36) : '未選択'}
            </span>
          </p>
        </div>
      </div>

      <div className={styles.body}>
        {!activeDirectory && (
          <p className={styles.empty}>
            参照ディレクトリが未設定です。先に「編集に戻る」からディレクトリを追加してください。
          </p>
        )}
        {activeDirectory && tree && (
          <DiffFolderRow
            node={tree}
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
    </aside>
  )
}
