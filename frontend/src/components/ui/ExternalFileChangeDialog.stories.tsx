import type { Meta, StoryObj } from '@storybook/react-vite'

import { ExternalFileChangeDialog } from './ExternalFileChangeDialog'

const meta = {
  title: 'UI/ExternalFileChangeDialog',
  component: ExternalFileChangeDialog,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onReload: () => undefined,
    onIgnore: () => undefined,
    onCancel: () => undefined,
  },
} satisfies Meta<typeof ExternalFileChangeDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  args: {
    open: true,
    fileName: 'users.table.json',
  },
}
