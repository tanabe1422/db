import { createContext, useContext } from 'react'

interface SidebarContextValue {
  collapsed: boolean
  width: number
  collapse: () => void
  expand: () => void
  setWidth: (width: number) => void
}

/**
 * Sidebar width at or below this uses compact mode switcher.
 * Toolbar needs ~206px inside the header; header padding is 24px (0.75rem × 2).
 */
export const SIDEBAR_COMPACT_WIDTH = 228

export const SidebarContext = createContext<SidebarContextValue | null>(null)

export function useSidebar() {
  const value = useContext(SidebarContext)
  if (!value) {
    throw new Error('useSidebar must be used within SidebarProvider')
  }
  return value
}
