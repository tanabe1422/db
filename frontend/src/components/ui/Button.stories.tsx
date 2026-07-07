import type { Meta, StoryObj } from '@storybook/react-vite'
import { FolderPlus, Save, Trash2, X } from 'lucide-react'

import { Button, IconButton } from './Button'

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    children: '保存',
  },
}

export const PrimaryWithIcon: Story = {
  render: () => (
    <Button>
      <Save size={16} aria-hidden="true" />
      保存
    </Button>
  ),
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'キャンセル',
  },
}

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: '削除',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    children: '保存',
  },
}

export const Plain: Story = {
  args: {
    variant: 'plain',
    children: 'コンテキスト用（className で装飾）',
  },
}

export const MenuItem: Story = {
  render: () => (
    <div style={{ width: '12rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', padding: '0.25rem 0' }}>
      <Button variant="menuItem">メニュー項目</Button>
      <Button variant="menuItem" disabled>
        無効な項目
      </Button>
    </div>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}>
      <Button>primary</Button>
      <Button variant="secondary">secondary</Button>
      <Button variant="ghost">ghost</Button>
      <Button variant="danger">danger</Button>
      <Button disabled>disabled</Button>
      <Button variant="plain">plain</Button>
      <Button variant="menuItem">menuItem</Button>
    </div>
  ),
}

export const IconButtons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <IconButton aria-label="閉じる">
        <X size={16} aria-hidden="true" />
      </IconButton>
      <IconButton variant="primary" aria-label="追加">
        <FolderPlus size={16} aria-hidden="true" />
      </IconButton>
      <IconButton variant="danger" aria-label="削除">
        <Trash2 size={16} aria-hidden="true" />
      </IconButton>
      <IconButton variant="active" aria-label="選択中">
        <FolderPlus size={16} aria-hidden="true" />
      </IconButton>
      <IconButton size="sm" aria-label="小">
        <X size={14} aria-hidden="true" />
      </IconButton>
      <IconButton variant="plain" size="sm" aria-label="plain sm">
        <X size={14} aria-hidden="true" />
      </IconButton>
    </div>
  ),
}
