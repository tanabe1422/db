import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { highlightClass } from './diffDisplayStyles'

const cssPath = join(dirname(fileURLToPath(import.meta.url)), 'FileDiffView.module.css')
const css = readFileSync(cssPath, 'utf8')

describe('FileDiffView highlight CSS specificity', () => {
  it('beats ColumnGridTable .table tbody td for added/removed/changed', () => {
    // Regression: .addedCell alone loses to .table tbody td (commit 3e8ea7f).
    // Require selectors at least as specific as .diffTable tbody td.<highlight>.
    const cases = [
      ['changedCell', 'changed'],
      ['addedCell', 'added'],
      ['removedCell', 'removed'],
    ] as const

    for (const [className, highlight] of cases) {
      expect(css).toMatch(
        new RegExp(`\\.diffTable\\s+tbody\\s+td\\.${className}\\s*\\{`),
      )
      expect(highlightClass(highlight)).toBeTruthy()
    }
  })

  it('does not rely only on weak single-class highlight rules', () => {
    // Bare `.addedCell {` without a higher-specificity companion would regress.
    const weakOnly = /^\.addedCell\s*\{/m.test(css) && !/\.diffTable\s+tbody\s+td\.addedCell/.test(css)
    expect(weakOnly).toBe(false)
  })
})
