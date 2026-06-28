import type { Meta, StoryObj } from '@storybook/react-vite'
import { ConfirmDialog } from './ConfirmDialog'

const meta = {
  title: 'UI/ConfirmDialog',
  component: ConfirmDialog,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onConfirm: () => undefined,
    onCancel: () => undefined,
  },
} satisfies Meta<typeof ConfirmDialog>

export default meta
type Story = StoryObj<typeof meta>

export const UnsavedChanges: Story = {
  args: {
    open: true,
    title: '未保存の変更',
    message: '未保存の変更があります。このタブを閉じますか？',
    confirmLabel: '閉じる',
    cancelLabel: 'キャンセル',
  },
}

export const Default: Story = {
  args: {
    open: true,
    title: '確認',
    message: 'この操作を実行しますか？',
  },
}
