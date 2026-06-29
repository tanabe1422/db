import { useEffect } from 'react'

/** Auxiliary mouse button index for the browser "back" side button. */
const MOUSE_BACK_BUTTON = 3

export function useMouseBackButton(onBack: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    function handleMouseDown(event: MouseEvent) {
      if (event.button !== MOUSE_BACK_BUTTON) return
      event.preventDefault()
      onBack()
    }

    window.addEventListener('mousedown', handleMouseDown)
    return () => window.removeEventListener('mousedown', handleMouseDown)
  }, [onBack, enabled])
}
