import { TableDefinitionView } from '../table/TableDefinitionView'
import { useTableDefinition } from '../../hooks/useTableDefinition'

import styles from '../../App.module.css'

interface TableDefinitionPanelProps {
  path: string
  onDirtyChange?: (dirty: boolean) => void
}

export function TableDefinitionPanel({
  path,
  onDirtyChange,
}: TableDefinitionPanelProps) {
  const { definition, loading, error } = useTableDefinition(path)

  if (loading) {
    return (
      <div className={styles.placeholder}>
        <p>読込中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.placeholder}>
        <h2>読込エラー</h2>
        <p className={styles.path}>{path}</p>
        <p>{error}</p>
      </div>
    )
  }

  if (!definition) {
    return null
  }

  return (
    <TableDefinitionView
      definition={definition}
      path={path}
      onDirtyChange={onDirtyChange}
    />
  )
}
