import { createContext, useContext } from 'react'

interface SidebarContextValue {
  collapsed: boolean
  collapse: () => void
  expand: () => void
}

export const SidebarContext = createContext<SidebarContextValue | null>(null)

export function useSidebar() {
  const value = useContext(SidebarContext)
  if (!value) {
    throw new Error('useSidebar must be used within CollapsibleSidebar')
  }
  return value
}
