import { useEffect } from 'react'

import type { EditorToolbarBridge } from '../toolbar/editorToolbarBridge'
import { cx } from '../../utils/cx'
import type { TableDefinition } from '../../types'
import { useExternalFileChange } from '../../hooks/useExternalFileChange'
import { ExternalFileChangeDialog } from '../ui/ExternalFileChangeDialog'
import { ColumnGridHeader } from './ColumnGridHeader'
import grid from './ColumnGridTable.module.css'
import { type TableEditor, useTableEditor } from '../../hooks/useTableEditor'
import { CheckCell } from './CheckCell'
import { EditableCell } from './EditableCell'
import { EditToolbar } from '../toolbar/EditToolbar'
import { RowActions } from './RowActions'
import { TableMetaForm } from './TableMetaForm'
import {
  indexNumbers,
  uniqueIndexNumbers,
  uniqueNumbers,
} from './navColumns'
import { useGridNavigation } from './useGridNavigation'
import styles from './TableDefinitionView.module.css'

interface TableDefinitionViewProps {
  definition: TableDefinition
  path: string
  isActive?: boolean
  inlineToolbar?: boolean
  onDirtyChange?: (dirty: boolean) => void
  onEditorBridgeChange?: (bridge: EditorToolbarBridge) => void
  onReload?: (silent?: boolean) => Promise<void>
}

export function TableDefinitionView({
  definition,
  path,
  isActive = true,
  inlineToolbar = true,
  onDirtyChange,
  onEditorBridgeChange,
  onReload,
}: TableDefinitionViewProps) {
  const editor = useTableEditor(definition, path)
  const dirty = editor?.dirty ?? false
  useEffect(() => {
    onDirtyChange?.(dirty)
  }, [dirty, onDirtyChange])

  const reloadFromDisk = onReload ?? (async () => undefined)
  const { dialogOpen, handleReload, handleIgnore, handleCancel } =
    useExternalFileChange({
      path,
      dirty,
      onReload: reloadFromDisk,
    })

  const fileName = path.split(/[\\/]/).pop() ?? path

  if (!editor) {
    return null
  }
  return (
    <>
      <TableEditorGrid
        editor={editor}
        isActive={isActive}
        inlineToolbar={inlineToolbar}
        onEditorBridgeChange={onEditorBridgeChange}
      />
      <ExternalFileChangeDialog
        open={dialogOpen}
        fileName={fileName}
        onReload={() => {
          void handleReload()
        }}
        onIgnore={() => {
          void handleIgnore()
        }}
        onCancel={handleCancel}
      />
    </>
  )
}

function TableEditorGrid({
  editor,
  isActive,
  inlineToolbar,
  onEditorBridgeChange,
}: {
  editor: TableEditor
  isActive: boolean
  inlineToolbar: boolean
  onEditorBridgeChange?: (bridge: EditorToolbarBridge) => void
}) {
  const nav = useGridNavigation(editor)
  const columns = editor.draft.columns

  useEffect(() => {
    if (!isActive || inlineToolbar) {
      return
    }
    onEditorBridgeChange?.({ editor, onSave: nav.handleSave })
    return () => {
      onEditorBridgeChange?.({ editor: null, onSave: null })
    }
  }, [editor, inlineToolbar, isActive, nav.handleSave, onEditorBridgeChange])

  return (
    <div
      className={styles.container}
      ref={nav.containerRef}
      tabIndex={0}
      onKeyDown={nav.handleKeyDown}
      onBlur={nav.handleContainerBlur}
    >
      {inlineToolbar && (
        <div className={styles.inlineToolbar}>
          <EditToolbar editor={editor} onSave={nav.handleSave} />
        </div>
      )}

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

      <div className={grid.tableWrapper}>
        <table className={cx(grid.table, styles.editorTable)}>
          <thead>
            <ColumnGridHeader
              showActionsColumn
              actionsColClass={styles.actionsCol}
              remarksExtraClass={grid.lastCol}
              dataTypeColClass={cx(grid.typeCell, grid.typeCellFixed)}
            />
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
                    className={cx(
                      grid.center,
                      grid.fixedCol,
                      styles.actionsCol,
                    )}
                  >
                    <RowActions
                      editor={editor}
                      rowId={column.rowId}
                      index={index}
                      total={columns.length}
                    />
                  </td>
                  <td
                    className={cx(
                      grid.center,
                      grid.fixedCol,
                      grid.gridLabel,
                      styles.rowHeader,
                    )}
                    onClick={(e) => nav.handleRowSelect(e, column.rowId)}
                  >
                    {index + 1}
                  </td>
                  <CheckCell column={column} colId="pk" nav={nav} />
                  {uniqueIndexNumbers.map((number) => (
                    <EditableCell
                      key={`uidx${number - 1}`}
                      column={column}
                      colId={`uidx${number - 1}`}
                      tdClass={grid.markerCol}
                      nav={nav}
                      editor={editor}
                    />
                  ))}
                  {indexNumbers.map((number) => (
                    <EditableCell
                      key={`idx${number - 1}`}
                      column={column}
                      colId={`idx${number - 1}`}
                      tdClass={grid.markerCol}
                      nav={nav}
                      editor={editor}
                    />
                  ))}
                  <CheckCell column={column} colId="identity" nav={nav} />
                  {uniqueNumbers.map((number) => (
                    <EditableCell
                      key={`uq${number - 1}`}
                      column={column}
                      colId={`uq${number - 1}`}
                      tdClass={grid.markerCol}
                      nav={nav}
                      editor={editor}
                    />
                  ))}
                  <CheckCell column={column} colId="nn" nav={nav} />
                  <EditableCell
                    column={column}
                    colId="name"
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
                    tdClass={cx(grid.typeCell, grid.typeCellFixed, styles.typeCellEditor)}
                    nav={nav}
                    editor={editor}
                  />
                  <EditableCell
                    column={column}
                    colId="len"
                    tdClass={grid.numCell}
                    nav={nav}
                    editor={editor}
                  />
                  <EditableCell
                    column={column}
                    colId="scale"
                    tdClass={grid.numCell}
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
                    tdClass={cx(grid.remarks, grid.lastCol)}
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
