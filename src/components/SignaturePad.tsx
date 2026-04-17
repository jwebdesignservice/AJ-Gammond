'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Eraser, Pen } from 'lucide-react'

/**
 * Canvas-based signature pad. Captures user's hand-drawn signature and exposes
 * it as a PNG data URL via `onChange`. Supports mouse + touch + pen input.
 *
 * `value` is a data URL (or '') — the parent form stores this string and
 * submits it as the `signature` field, same shape as the old typed-name flow.
 * That means no DB migration is required: any text column (like
 * `ajg_rep_signature` / `signature`) now holds a `data:image/png;base64,...`
 * string when the user signs with their hand.
 */

interface SignaturePadProps {
  value: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
  className?: string
  /** Canvas drawing height in px (default 160) */
  height?: number
}

export default function SignaturePad({
  value,
  onChange,
  label,
  required = false,
  className = '',
  height = 160,
}: SignaturePadProps) {
  const canvasRef      = useRef<HTMLCanvasElement | null>(null)
  const containerRef   = useRef<HTMLDivElement | null>(null)
  const drawingRef     = useRef(false)
  const lastPtRef      = useRef<{ x: number; y: number } | null>(null)
  const hasStrokesRef  = useRef(false)
  // Capture the initial `value` so that resize() never clears the canvas
  // just because the parent re-rendered with a new data URL from our own
  // onChange. Only the first value (on mount / reset) should ever seed the
  // canvas; after that, the canvas is the source of truth.
  const initialValueRef = useRef(value)
  const [isEmpty, setIsEmpty] = useState(!value)

  // Sync canvas size to container width. Preserves the current drawing
  // across resizes via toDataURL → re-drawImage. Intentionally stable
  // (depends only on `height`) so it doesn't re-fire on every onChange.
  const resize = useCallback(() => {
    const canvas    = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    // Prefer the live canvas contents over the ref so user strokes persist
    const current = hasStrokesRef.current
      ? canvas.toDataURL('image/png')
      : initialValueRef.current

    const dpr = window.devicePixelRatio || 1
    const w   = container.clientWidth
    const h   = height

    canvas.style.width  = w + 'px'
    canvas.style.height = h + 'px'
    canvas.width  = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth   = 2

    if (current && current.startsWith('data:image')) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, w, h)
      }
      img.src = current
    }
  }, [height])

  useEffect(() => {
    resize()
    const ro = new ResizeObserver(resize)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [resize])

  // If the parent explicitly resets `value` back to empty (eg. after a
  // successful submit), wipe the canvas too.
  useEffect(() => {
    if (value === '' && hasStrokesRef.current) {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const dpr = window.devicePixelRatio || 1
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr)
      hasStrokesRef.current = false
      initialValueRef.current = ''
      setIsEmpty(true)
    }
  }, [value])

  function pointFromEvent(e: MouseEvent | TouchEvent | PointerEvent) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    let clientX = 0, clientY = 0
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else if ('clientX' in e) {
      clientX = e.clientX
      clientY = e.clientY
    }
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  function start(e: PointerEvent | TouchEvent | MouseEvent) {
    e.preventDefault()
    const pt = pointFromEvent(e)
    if (!pt) return
    drawingRef.current = true
    lastPtRef.current  = pt
  }

  function move(e: PointerEvent | TouchEvent | MouseEvent) {
    if (!drawingRef.current) return
    e.preventDefault()
    const pt = pointFromEvent(e)
    const canvas = canvasRef.current
    if (!pt || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx || !lastPtRef.current) return
    ctx.beginPath()
    ctx.moveTo(lastPtRef.current.x, lastPtRef.current.y)
    ctx.lineTo(pt.x, pt.y)
    ctx.stroke()
    lastPtRef.current = pt
    hasStrokesRef.current = true
    if (isEmpty) setIsEmpty(false)
  }

  function end() {
    if (!drawingRef.current) return
    drawingRef.current = false
    lastPtRef.current  = null
    const canvas = canvasRef.current
    if (canvas && hasStrokesRef.current) {
      onChange(canvas.toDataURL('image/png'))
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Pointer events cover mouse / pen / touch in one path
    const startH = (e: PointerEvent) => start(e)
    const moveH  = (e: PointerEvent) => move(e)
    const endH   = () => end()
    canvas.addEventListener('pointerdown', startH)
    canvas.addEventListener('pointermove', moveH)
    canvas.addEventListener('pointerup',   endH)
    canvas.addEventListener('pointerleave', endH)
    // Fallback for older touch-only browsers
    canvas.addEventListener('touchstart', startH as unknown as EventListener, { passive: false })
    canvas.addEventListener('touchmove',  moveH  as unknown as EventListener, { passive: false })
    canvas.addEventListener('touchend',   endH)
    return () => {
      canvas.removeEventListener('pointerdown', startH)
      canvas.removeEventListener('pointermove', moveH)
      canvas.removeEventListener('pointerup',   endH)
      canvas.removeEventListener('pointerleave', endH)
      canvas.removeEventListener('touchstart', startH as unknown as EventListener)
      canvas.removeEventListener('touchmove',  moveH  as unknown as EventListener)
      canvas.removeEventListener('touchend',   endH)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmpty])

  function clear() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    hasStrokesRef.current = false
    setIsEmpty(true)
    onChange('')
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div
        ref={containerRef}
        className="relative w-full rounded-[3px] border border-gray-200 bg-white overflow-hidden"
        style={{ height }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
        />
        {isEmpty && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-gray-400 text-sm gap-2">
            <Pen className="w-4 h-4" />
            <span>Sign here with your finger or stylus</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-xs text-gray-400">By signing you confirm the information is accurate.</p>
        <button
          type="button"
          onClick={clear}
          className="text-xs text-gray-500 hover:text-[#1B4332] font-semibold inline-flex items-center gap-1"
        >
          <Eraser className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>
    </div>
  )
}
