import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const previewPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../.storybook/preview.tsx',
)
const preview = readFileSync(previewPath, 'utf8')

describe('Storybook preview providers', () => {
  it('wraps stories with GenBatchProgressProvider', () => {
    // Regression: App / DirectoryPanel / DiffSetupPanel crash without this.
    expect(preview).toMatch(/GenBatchProgressProvider/)
    expect(preview).toMatch(/decorators:\s*\[withProviders\]/)
  })
})
