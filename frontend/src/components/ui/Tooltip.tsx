import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type HTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type Ref,
} from 'react'
import { createPortal } from 'react-dom'

import {
  computeTooltipPosition,
  type TooltipAlign,
  ZOOM_CHANGE_EVENT,
} from '../../lib/appZoom'
import { cx } from '../../utils/cx'
import styles from './Tooltip.module.css'

const SHOW_DELAY_MS = 350

type TooltipChildProps = HTMLAttributes<HTMLElement> & {
  disabled?: boolean
  ref?: Ref<HTMLElement>
}

interface TooltipProps {
  content: string
  children: ReactElement<TooltipChildProps>
  /** When true, long paths may wrap. Default keeps labels on one line. */
  wrap?: boolean
}

function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') {
    ref(value)
    return
  }
  if (ref && typeof ref === 'object') {
    ref.current = value
  }
}

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (value: T | null) => {
    for (const ref of refs) {
      setRef(ref, value)
    }
  }
}

function isDisabledElement(element: ReactElement<TooltipChildProps>): boolean {
  return element.props.disabled === true
}

const ALIGN_CLASS: Record<TooltipAlign, string> = {
  center: styles.alignCenter,
  start: styles.alignStart,
  end: styles.alignEnd,
}

export function Tooltip({ content, children, wrap = false }: TooltipProps) {
  const tooltipId = useId()
  const triggerRef = useRef<HTMLElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const showTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<{
    top: number
    left: number
    align: TooltipAlign
  }>({ top: 0, left: 0, align: 'center' })

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    const tooltip = tooltipRef.current
    if (!trigger) {
      return
    }
    const triggerRect = trigger.getBoundingClientRect()
    if (tooltip) {
      setPosition(computeTooltipPosition(triggerRect, tooltip.getBoundingClientRect()))
      return
    }
    setPosition({
      ...computeTooltipPosition(triggerRect, { width: 0, height: 0 }),
    })
  }, [])

  const show = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current)
    }
    showTimerRef.current = setTimeout(() => {
      setVisible(true)
    }, SHOW_DELAY_MS)
  }, [])

  const hide = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current)
      showTimerRef.current = undefined
    }
    setVisible(false)
  }, [])

  useLayoutEffect(() => {
    if (!visible) {
      return
    }
    updatePosition()
    const onReposition = () => updatePosition()
    window.addEventListener('scroll', onReposition, true)
    window.addEventListener('resize', onReposition)
    window.addEventListener(ZOOM_CHANGE_EVENT, onReposition)
    return () => {
      window.removeEventListener('scroll', onReposition, true)
      window.removeEventListener('resize', onReposition)
      window.removeEventListener(ZOOM_CHANGE_EVENT, onReposition)
    }
  }, [visible, content, updatePosition])

  useEffect(() => {
    return () => {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current)
      }
    }
  }, [])

  if (!content || !isValidElement(children)) {
    return children
  }

  const trigger = children
  const describedBy = visible ? tooltipId : undefined

  function onMouseEnter(event: MouseEvent<HTMLElement>) {
    trigger.props.onMouseEnter?.(event)
    show()
  }

  function onMouseLeave(event: MouseEvent<HTMLElement>) {
    trigger.props.onMouseLeave?.(event)
    hide()
  }

  function onFocus(event: FocusEvent<HTMLElement>) {
    trigger.props.onFocus?.(event)
    show()
  }

  function onBlur(event: FocusEvent<HTMLElement>) {
    trigger.props.onBlur?.(event)
    hide()
  }

  function onContextMenu(event: MouseEvent<HTMLElement>) {
    hide()
    trigger.props.onContextMenu?.(event)
  }

  const tooltip = visible
    ? createPortal(
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className={cx(styles.tooltip, ALIGN_CLASS[position.align], wrap && styles.wrap)}
          style={{ top: position.top, left: position.left }}
        >
          {content}
        </div>,
        document.body,
      )
    : null

  if (isDisabledElement(trigger)) {
    return (
      <>
        <span
          ref={triggerRef}
          className={styles.triggerWrap}
          onMouseEnter={show}
          onMouseLeave={hide}
          onContextMenu={hide}
          onFocusCapture={show}
          onBlurCapture={hide}
        >
          {trigger}
        </span>
        {tooltip}
      </>
    )
  }

  return (
    <>
      {cloneElement(trigger, {
        ref: mergeRefs(triggerRef, trigger.props.ref),
        onMouseEnter,
        onMouseLeave,
        onFocus,
        onBlur,
        onContextMenu,
        'aria-describedby': describedBy,
      })}
      {tooltip}
    </>
  )
}
