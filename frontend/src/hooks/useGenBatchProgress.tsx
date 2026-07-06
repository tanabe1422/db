import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { ProgressDialog } from '../components/ui/ProgressDialog'
import type { BatchProgress } from '../lib/batchProgress'
import { shouldShowBatchProgress } from '../lib/batchProgress'

interface ProgressState extends BatchProgress {
  title: string
}

interface RunGenBatchOptions<T> {
  title: string
  task: (report: (progress: BatchProgress) => void) => Promise<T>
}

interface GenBatchProgressContextValue {
  runGenBatch: <T>(options: RunGenBatchOptions<T>) => Promise<T>
  isRunning: boolean
}

const GenBatchProgressContext =
  createContext<GenBatchProgressContextValue | null>(null)

export function GenBatchProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressState | null>(null)

  const runGenBatch = useCallback(
    async <T,>({ title, task }: RunGenBatchOptions<T>): Promise<T> => {
      const report = (next: BatchProgress) => {
        if (!shouldShowBatchProgress(next.total)) {
          return
        }
        setProgress({ title, ...next })
      }

      try {
        return await task(report)
      } finally {
        setProgress(null)
      }
    },
    [],
  )

  const value = useMemo(
    () => ({
      runGenBatch,
      isRunning: progress !== null,
    }),
    [progress, runGenBatch],
  )

  return (
    <GenBatchProgressContext.Provider value={value}>
      {children}
      <ProgressDialog
        open={progress !== null}
        title={progress?.title ?? ''}
        current={progress?.current ?? 0}
        total={progress?.total ?? 1}
        label={progress?.label}
      />
    </GenBatchProgressContext.Provider>
  )
}

export function useGenBatchProgress(): GenBatchProgressContextValue {
  const context = useContext(GenBatchProgressContext)
  if (!context) {
    throw new Error(
      'useGenBatchProgress must be used within GenBatchProgressProvider',
    )
  }
  return context
}
