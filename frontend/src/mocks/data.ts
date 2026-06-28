import type { TableDefinition, TreeNode } from '../types'

export const mockTree: TreeNode = {
  name: 'project',
  path: '',
  isDir: true,
  children: [
    {
      name: 'src',
      path: '',
      isDir: true,
      children: [
        {
          name: 'db',
          path: '',
          isDir: true,
          children: [
            {
              name: 'users.table.json',
              path: 'C:\\project\\src\\db\\users.table.json',
              isDir: false,
              children: [],
            },
            {
              name: 'orders.table.json',
              path: 'C:\\project\\src\\db\\orders.table.json',
              isDir: false,
              children: [],
            },
          ],
        },
      ],
    },
  ],
}

export const mockSettings = {
  directories: [
    'C:\\project',
    'C:\\another-project',
  ],
  activeDirectory: 'C:\\project',
}

export const mockTableDefinition: TableDefinition = {
  schemaVersion: 1,
  name: 'users',
  nameJa: 'ユーザー',
  description: 'アプリ利用者マスタ',
  primaryKey: ['id'],
  columns: [
    {
      name: 'id',
      nameJa: 'ID',
      dataType: 'bigint',
      notNull: true,
    },
    {
      name: 'email',
      nameJa: 'メールアドレス',
      dataType: 'nvarchar',
      length: 255,
      notNull: true,
      unique: true,
    },
    {
      name: 'balance',
      nameJa: '残高',
      dataType: 'decimal',
      precision: 18,
      scale: 2,
      notNull: true,
      defaultValue: 0,
    },
    {
      name: 'createdAt',
      nameJa: '作成日時',
      dataType: 'datetime2',
      notNull: true,
    },
  ],
  indexes: [
    {
      keys: [{ column: 'createdAt', order: 'desc' }],
      include: ['email'],
    },
    {
      keys: [{ column: 'id' }, { column: 'email', order: 'desc' }],
    },
    {
      keys: [{ column: 'balance' }],
      include: ['id', 'createdAt'],
    },
  ],
}
