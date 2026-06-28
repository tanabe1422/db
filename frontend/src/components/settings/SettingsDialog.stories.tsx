import type { Meta, StoryObj } from '@storybook/react-vite'
import { SettingsDialog } from './SettingsDialog'
import { mockSettings } from '../../mocks/data'

const meta = {
  title: 'Settings/SettingsDialog',
  component: SettingsDialog,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SettingsDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    open: true,
    settings: { directories: [], activeDirectory: '' },
    onClose: () => undefined,
    onAdd: () => undefined,
    onRemove: () => undefined,
    onSetActive: () => undefined,
    onMove: () => undefined,
  },
}

export const WithDirectories: Story = {
  args: {
    open: true,
    settings: mockSettings,
    onClose: () => undefined,
    onAdd: () => undefined,
    onRemove: () => undefined,
    onSetActive: () => undefined,
    onMove: () => undefined,
  },
}
