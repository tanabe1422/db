import { useCallback, useEffect, useState } from 'react'
import { readTextFile } from '../lib/wails'

interface TextFileState {
  content: string | null
  loading: boolean
  error: string | null
}

const initialState: TextFileState = {
  content: null,
  loading: false,
  error: null,
}

export function useTextFile(path: string) {
  const [state, setState] = useState<TextFileState>(initialState)

  const load = useCallback(async (silent = false) => {
    if (!path) {
      setState(initialState)
      return
    }

    setState((prev) =>
      silent && prev.content !== null
        ? { ...prev, error: null }
        : { ...initialState, loading: true },
    )
    try {
      const content = await readTextFile(path)
      setState({
        content,
        loading: false,
        error: null,
      })
    } catch (err) {
      setState({
        content: null,
        loading: false,
        error: err instanceof Error ? err.message : 'ファイルの読込に失敗しました',
      })
    }
  }, [path])

  useEffect(() => {
    void load()
  }, [load])

  return { ...state, reload: load }
}
