import { useCallback, useEffect, useState } from 'react'
import type { TableDefinition } from '../types'
import {
  normalizeTableDefinition,
} from '../utils/serializeTable'
import { errorMessage } from '../lib/errorMessage'
import { readTableFile } from '../lib/wails'
import {
  validateTableDefinition,
  type ValidationError,
} from '../lib/validateTable'

interface TableDefinitionState {
  definition: TableDefinition | null
  errors: ValidationError[]
  loading: boolean
  error: string | null
}

const initialState: TableDefinitionState = {
  definition: null,
  errors: [],
  loading: false,
  error: null,
}

export function useTableDefinition(path: string) {
  const [state, setState] = useState<TableDefinitionState>(initialState)

  const load = useCallback(async (silent = false) => {
    if (!path) {
      setState(initialState)
      return
    }

    setState((prev) =>
      silent && prev.definition
        ? { ...prev, error: null }
        : { ...initialState, loading: true },
    )
    try {
      const raw = await readTableFile(path)
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        setState({
          definition: null,
          errors: [],
          loading: false,
          error: 'JSON の解析に失敗しました',
        })
        return
      }

      const normalized = normalizeTableDefinition(parsed)
      const errors = validateTableDefinition(normalized)
      setState({
        definition: normalized as TableDefinition,
        errors,
        loading: false,
        error: null,
      })
    } catch (err) {
      setState({
        definition: null,
        errors: [],
        loading: false,
        error: errorMessage(err, 'ファイルの読込に失敗しました'),
      })
    }
  }, [path])

  useEffect(() => {
    void load()
  }, [load])

  return { ...state, reload: load }
}
