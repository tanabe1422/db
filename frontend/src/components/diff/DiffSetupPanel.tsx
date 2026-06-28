import { useState } from 'react'
import { ArrowLeft, ChevronDown, ChevronRight, Folder } from 'lucide-react'

import type { TreeNode } from '../../types'
import { truncateMiddle } from '../../utils/truncateMiddle'

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
}

function FolderRow({
  node,
  depth,
  leftPath,
  rightPath,
  onSelectLeft,
  onSelectRight,
}: {
  node: TreeNode
  depth: number
  leftPath?: string
  rightPath?: string
  onSelectLeft: (node: TreeNode) => void
  onSelectRight: (node: TreeNode) => void
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const childDirs = node.children.filter((child) => child.isDir)
  const hasChildDirs = childDirs.length > 0
  const isLeft = node.path === leftPath
  const isRight = node.path === rightPath

  return (
    <div className={styles.branch}>
      <div className={styles.row}>
        <button
          type="button"
          className={styles.expand}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          onClick={() => hasChildDirs && setExpanded((v) => !v)}
          title={node.path}
        >
          <span className={styles.caret}>
            {hasChildDirs ? (
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
        <span className={styles.assign}>
          <button
            type="button"
            className={`${styles.side}${isLeft ? ` ${styles.sideLeftActive}` : ''}`}
            onClick={() => onSelectLeft(node)}
            aria-label={`${diffSideAriaLabel('left')}に指定`}
          >
            <DiffSideMark side="left" size="sm" />
          </button>
          <button
            type="button"
            className={`${styles.side}${isRight ? ` ${styles.sideRightActive}` : ''}`}
            onClick={() => onSelectRight(node)}
            aria-label={`${diffSideAriaLabel('right')}に指定`}
          >
            <DiffSideMark side="right" size="sm" />
          </button>
        </span>
      </div>
      {expanded &&
        childDirs.map((child) => (
          <FolderRow
            key={child.path || child.name}
            node={child}
            depth={depth + 1}
            leftPath={leftPath}
            rightPath={rightPath}
            onSelectLeft={onSelectLeft}
            onSelectRight={onSelectRight}
          />
        ))}
    </div>
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
}: DiffSetupPanelProps) {
  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2>フォルダ比較</h2>
          <button
            type="button"
            className={styles.backBtn}
            onClick={onExitDiff}
          >
            <ArrowLeft size={14} aria-hidden="true" />
            編集に戻る
          </button>
        </div>
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
          <FolderRow
            node={tree}
            depth={0}
            leftPath={leftPath}
            rightPath={rightPath}
            onSelectLeft={onSelectLeft}
            onSelectRight={onSelectRight}
          />
        )}
      </div>
    </aside>
  )
}
