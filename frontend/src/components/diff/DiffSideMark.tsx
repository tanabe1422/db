import { ChevronLeft, ChevronRight } from 'lucide-react'

import styles from './DiffSideMark.module.css'

export type DiffSide = 'left' | 'right'

interface DiffSideMarkProps {
  side: DiffSide
  size?: 'sm' | 'md'
  className?: string
}

export function diffSideAriaLabel(side: DiffSide): string {
  return side === 'left' ? '左' : '右'
}

const ICON_SIZE = { sm: 12, md: 14 } as const

export function DiffSideMark({ side, size = 'md', className }: DiffSideMarkProps) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  const iconSize = ICON_SIZE[size]

  return (
    <Icon
      size={iconSize}
      strokeWidth={2.5}
      aria-hidden="true"
      className={[
        styles.mark,
        side === 'left' ? styles.left : styles.right,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}
