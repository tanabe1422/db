import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Checkbox } from './Checkbox'

const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Unchecked: Story = {
  args: {
    checked: false,
    'aria-label': '未チェック',
  },
}

export const Checked: Story = {
  args: {
    checked: true,
    'aria-label': 'チェック済み',
  },
}

export const ReadOnly: Story = {
  args: {
    checked: true,
    readOnly: true,
    'aria-label': '読み取り専用',
  },
}

export const Interactive: Story = {
  args: {
    checked: false,
    'aria-label': '切り替え',
  },
  render: function InteractiveStory() {
    const [checked, setChecked] = useState(false)
    return (
      <Checkbox
        checked={checked}
        onChange={setChecked}
        aria-label="切り替え"
      />
    )
  },
}
