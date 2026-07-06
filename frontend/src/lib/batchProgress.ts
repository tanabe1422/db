export interface BatchProgress {
  current: number
  total: number
  label?: string
}

export type BatchProgressHandler = (progress: BatchProgress) => void

export function shouldShowBatchProgress(total: number): boolean {
  return total > 1
}

export function reportBatchProgress(
  handler: BatchProgressHandler | undefined,
  progress: BatchProgress,
): void {
  if (!handler || !shouldShowBatchProgress(progress.total)) {
    return
  }
  handler(progress)
}
