import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { DiffSideAssignButtons } from './DiffSideAssignButtons'

const meta = {
  title: 'Diff/DiffSideAssignButtons',
  component: DiffSideAssignButtons,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof DiffSideAssignButtons>

export default meta
type Story = StoryObj<typeof meta>

export const Idle: Story = {
  args: {
    isLeft: false,
    isRight: false,
    onSelectLeft: () => undefined,
    onSelectRight: () => undefined,
  },
}

export const LeftActive: Story = {
  args: {
    isLeft: true,
    isRight: false,
    onSelectLeft: () => undefined,
    onSelectRight: () => undefined,
  },
}

export const RightActive: Story = {
  args: {
    isLeft: false,
    isRight: true,
    onSelectLeft: () => undefined,
    onSelectRight: () => undefined,
  },
}

export const Interactive: Story = {
  args: {
    isLeft: false,
    isRight: false,
    onSelectLeft: () => undefined,
    onSelectRight: () => undefined,
  },
  render: function InteractiveStory() {
    const [side, setSide] = useState<'left' | 'right' | null>(null)
    return (
      <DiffSideAssignButtons
        isLeft={side === 'left'}
        isRight={side === 'right'}
        onSelectLeft={() => setSide('left')}
        onSelectRight={() => setSide('right')}
      />
    )
  },
}
