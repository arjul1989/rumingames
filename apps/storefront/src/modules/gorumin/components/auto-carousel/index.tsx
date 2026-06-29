"use client"

import {
  Children,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react"
import { clx } from "@modules/common/components/ui"

type AutoCarouselProps = {
  children: ReactNode
  intervalMs?: number
  className?: string
  "aria-label"?: string
}

// Full-width cyclic carousel with automatic advance and dot navigation.
export default function AutoCarousel({
  children,
  intervalMs = 6000,
  className,
  "aria-label": ariaLabel = "Carrusel",
}: AutoCarouselProps) {
  const slides = Children.toArray(children).filter(Boolean)
  const count = slides.length
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const goTo = useCallback(
    (next: number) => {
      if (count <= 0) return
      setIndex(((next % count) + count) % count)
    },
    [count]
  )

  useEffect(() => {
    if (count <= 1 || paused) return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % count)
    }, intervalMs)
    return () => clearInterval(id)
  }, [count, intervalMs, paused])

  if (count === 0) return null

  if (count === 1) {
    return <div className={className}>{slides[0]}</div>
  }

  return (
    <div
      className={clx("relative w-full", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="overflow-hidden rounded-2xl" aria-label={ariaLabel}>
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, i) => (
            <div key={i} className="min-w-full flex-shrink-0 flex-grow-0 basis-full">
              {slide}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Ir al slide ${i + 1}`}
            aria-current={i === index ? "true" : undefined}
            onClick={() => goTo(i)}
            className={clx(
              "h-2 rounded-full transition-all duration-300",
              i === index
                ? "w-8 bg-primary"
                : "w-2 bg-on-surface-variant/30 hover:bg-on-surface-variant/50"
            )}
          />
        ))}
      </div>
    </div>
  )
}
