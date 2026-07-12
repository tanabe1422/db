import type { Meta, StoryObj } from '@storybook/react-vite'

import { AlertDialog } from './AlertDialog'

const meta = {
  title: 'UI/AlertDialog',
  component: AlertDialog,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onClose: () => undefined,
  },
} satisfies Meta<typeof AlertDialog>

export default meta
type Story = StoryObj<typeof meta>

export const WithItems: Story = {
  args: {
    open: true,
    title: '検証エラー',
    message: '次の項目を修正してください。',
    items: [
      { label: 'name', detail: '必須です' },
      { label: 'columns[0].dataType', detail: '不正な型です' },
    ],
  },
}

export const Simple: Story = {
  args: {
    open: true,
    title: '完了',
    message: '処理が完了しました。',
  },
}
