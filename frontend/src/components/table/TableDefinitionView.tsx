import { useEffect } from 'react'

import type { TableDefinition } from '../../types'
import { MAX_INDEXES } from '../../utils/columnMeta'
import { type TableEditor, useTableEditor } from '../../hooks/useTableEditor'
import { CheckCell } from './CheckCell'
import { EditableCell } from './EditableCell'
import { EditorToolbar } from './EditorToolbar'
import { RowActions } from './RowActions'
import { TableMetaForm } from './TableMetaForm'
import { indexNumbers } from './navColumns'
import { useGridNavigation } from './useGridNavigation'
import styles from './TableDefinitionView.module.css'

interface TableDefinitionViewProps {
  definition: TableDefinition
  path: string
  onDirtyChange?: (dirty: boolean) => void
}

export function TableDefinitionView({
  definition,
  path,
  onDirtyChange,
}: TableDefinitionViewProps) {
  const editor = useTableEditor(definition, path)
  const dirty = editor?.dirty ?? false
  useEffect(() => {
    onDirtyChange?.(dirty)
  }, [dirty, onDirtyChange])
  if (!editor) {
    return null
  }
  return <TableEditorGrid editor={editor} />
}

function TableEditorGrid({ editor }: { editor: TableEditor }) {
  const nav = useGridNavigation(editor)
  const columns = editor.draft.columns

  return (
    <div
      className={styles.container}
      ref={nav.containerRef}
      tabIndex={0}
      onKeyDown={nav.handleKeyDown}
      onBlur={nav.handleContainerBlur}
    >
      <EditorToolbar editor={editor} onSave={nav.handleSave} />

      <TableMetaForm
        name={editor.draft.name}
        nameJa={editor.draft.nameJa}
        description={editor.draft.description}
        onChange={editor.updateMeta}
      />

      {nav.validationVisible && nav.errors.length > 0 && (
        <div className={styles.errors}>
          <p className={styles.errorsTitle}>
            検証エラー（{nav.errors.length}件）
          </p>
          <ul>
            {nav.errors.map((error, index) => (
              <li key={`${error.path}-${index}`}>
                <code>{error.path || '(root)'}</code> {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th
                className={`${styles.center} ${styles.fixedCol} ${styles.actionsCol}`}
                rowSpan={2}
              >
                操作
              </th>
              <th className={`${styles.center} ${styles.fixedCol}`} rowSpan={2}>
                番号
              </th>
              <th className={`${styles.center} ${styles.fixedCol}`} rowSpan={2}>
                PK
              </th>
              <th className={styles.center} colSpan={MAX_INDEXES}>
                Index
              </th>
              <th
                className={`${styles.center} ${styles.fixedCol}`}
                rowSpan={2}
                title="Unique"
              >
                UQ
              </th>
              <th
                className={`${styles.center} ${styles.fixedCol}`}
                rowSpan={2}
                title="NOT NULL"
              >
                NN
              </th>
              <th rowSpan={2}>カラム名（英）</th>
              <th rowSpan={2}>カラム名（日）</th>
              <th className={`${styles.mono} ${styles.typeCell}`} rowSpan={2}>
                型
              </th>
              <th className={styles.numCell} rowSpan={2}>
                桁数
              </th>
              <th className={styles.numCell} rowSpan={2}>
                精度
              </th>
              <th rowSpan={2}>既定値</th>
              <th className={`${styles.remarks} ${styles.lastCol}`} rowSpan={2}>
                備考
              </th>
            </tr>
            <tr>
              {indexNumbers.map((number) => (
                <th key={number} className={styles.markerCol}>
                  {number}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {columns.map((column, index) => {
              const selected = editor.selectedRowIds.has(column.rowId)
              return (
                <tr
                  key={column.rowId}
                  className={selected ? styles.selectedRow : undefined}
                >
                  <td
                    className={`${styles.center} ${styles.fixedCol} ${styles.actionsCol}`}
                  >
                    <RowActions
                      editor={editor}
                      rowId={column.rowId}
                      index={index}
                      total={columns.length}
                    />
                  </td>
                  <td
                    className={`${styles.center} ${styles.fixedCol} ${styles.rowHeader}`}
                    onClick={(e) => nav.handleRowSelect(e, column.rowId)}
                  >
                    {index + 1}
                  </td>
                  <CheckCell column={column} colId="pk" nav={nav} />
                  {indexNumbers.map((number) => (
                    <EditableCell
                      key={`idx${number - 1}`}
                      column={column}
                      colId={`idx${number - 1}`}
                      tdClass={styles.markerCol}
                      nav={nav}
                      editor={editor}
                    />
                  ))}
                  <CheckCell column={column} colId="uq" nav={nav} />
                  <CheckCell column={column} colId="nn" nav={nav} />
                  <EditableCell
                    column={column}
                    colId="name"
                    tdClass={styles.mono}
                    nav={nav}
                    editor={editor}
                  />
                  <EditableCell
                    column={column}
                    colId="nameJa"
                    nav={nav}
                    editor={editor}
                  />
                  <EditableCell
                    column={column}
                    colId="dataType"
                    tdClass={`${styles.mono} ${styles.typeCell}`}
                    nav={nav}
                    editor={editor}
                  />
                  <EditableCell
                    column={column}
                    colId="len"
                    tdClass={styles.numCell}
                    nav={nav}
                    editor={editor}
                  />
                  <EditableCell
                    column={column}
                    colId="scale"
                    tdClass={styles.numCell}
                    nav={nav}
                    editor={editor}
                  />
                  <EditableCell
                    column={column}
                    colId="default"
                    nav={nav}
                    editor={editor}
                  />
                  <EditableCell
                    column={column}
                    colId="remarks"
                    tdClass={`${styles.remarks} ${styles.lastCol}`}
                    nav={nav}
                    editor={editor}
                  />
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
