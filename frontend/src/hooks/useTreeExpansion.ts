import { useState } from 'react'

export function useTreeExpansion(depth: number, threshold = 2) {
  return useState(depth < threshold)
}
