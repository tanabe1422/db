import type { Meta, StoryObj } from '@storybook/react-vite'
import { ProgressDialog } from './ProgressDialog'

const meta = {
  title: 'UI/ProgressDialog',
  component: ProgressDialog,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ProgressDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Start: Story = {
  args: {
    open: true,
    title: '作成スクリプトを生成中…',
    current: 0,
    total: 10,
    label: 'tables/users.table.json',
  },
}

export const InProgress: Story = {
  args: {
    open: true,
    title: '定義書をエクスポート中…',
    current: 3,
    total: 10,
    label: 'tables/orders.table.json',
  },
}

export const Complete: Story = {
  args: {
    open: true,
    title: '変更スクリプトを生成中…',
    current: 10,
    total: 10,
    label: 'tables/products.table.json',
  },
}
