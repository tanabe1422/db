export type DiffSide = 'left' | 'right'

export function diffSideAriaLabel(side: DiffSide): string {
  return side === 'left' ? '左' : '右'
}
