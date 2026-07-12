import type { Meta, StoryObj } from '@storybook/react-vite'

import { PromptDialog } from './PromptDialog'

const meta = {
  title: 'UI/PromptDialog',
  component: PromptDialog,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onConfirm: () => undefined,
    onCancel: () => undefined,
  },
} satisfies Meta<typeof PromptDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Rename: Story = {
  args: {
    open: true,
    title: '名前を変更',
    label: '新しい名前',
    defaultValue: 'users',
    confirmLabel: '変更',
  },
}
