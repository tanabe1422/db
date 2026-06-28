import type { Meta, StoryObj } from '@storybook/react-vite'
import { DiffSideMark } from './DiffSideMark'

const meta = {
  title: 'Diff/DiffSideMark',
  component: DiffSideMark,
} satisfies Meta<typeof DiffSideMark>

export default meta
type Story = StoryObj<typeof meta>

export const Left: Story = {
  args: { side: 'left' },
}

export const Right: Story = {
  args: { side: 'right' },
}

export const Small: Story = {
  args: { side: 'left', size: 'sm' },
}
