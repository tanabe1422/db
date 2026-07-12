import type { Meta, StoryObj } from '@storybook/react-vite'

import { WorkspacePlaceholder } from './WorkspacePlaceholder'

const meta = {
  title: 'Workspace/WorkspacePlaceholder',
  component: WorkspacePlaceholder,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof WorkspacePlaceholder>

export default meta
type Story = StoryObj<typeof meta>

export const WithTitleAndMessage: Story = {
  args: {
    title: 'テーブル定義を選択',
    message: '左のパネルから *.table.json ファイルを選択してください。',
  },
}

export const MessageOnly: Story = {
  args: {
    message: '読込中...',
  },
}

export const WithPath: Story = {
  args: {
    title: '読込エラー',
    path: 'C:\\project\\src\\db\\users.table.json',
    message: 'ファイルの読み込みに失敗しました',
  },
}
