"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { flushSync } from "react-dom"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number
  /** When true, the transition expands from the viewport center instead of the button center. */
  fromCenter?: boolean
}

function getThemeTransitionClipPaths(
  cx: number,
  cy: number,
  maxRadius: number
): [string, string] {
  return [
    `circle(0px at ${cx}px ${cy}px)`,
    `circle(${maxRadius}px at ${cx}px ${cy}px)`,
  ]
}

export const AnimatedThemeToggler = ({
  className,
  duration = 450,
  fromCenter = false,
  ...props
}: AnimatedThemeTogglerProps) => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = useCallback(() => {
    const button = buttonRef.current
    if (!button) return

    const viewportWidth = window.visualViewport?.width ?? window.innerWidth
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight

    let x: number
    let y: number
    if (fromCenter) {
      x = viewportWidth / 2
      y = viewportHeight / 2
    } else {
      const { top, left, width, height } = button.getBoundingClientRect()
      x = left + width / 2
      y = top + height / 2
    }

    const maxRadius = Math.hypot(
      Math.max(x, viewportWidth - x),
      Math.max(y, viewportHeight - y)
    )

    const applyTheme = () => {
      const newTheme = theme === "dark" ? "light" : "dark"
      setTheme(newTheme)
    }

    // @ts-ignore
    if (typeof document.startViewTransition !== "function") {
      applyTheme()
      return
    }

    const clipPath = getThemeTransitionClipPaths(x, y, maxRadius)

    const root = document.documentElement
    root.dataset.magicuiThemeVt = "active"
    root.style.setProperty(
      "--magicui-theme-toggle-vt-duration",
      `${duration}ms`
    )
    root.style.setProperty("--magicui-theme-vt-clip-from", clipPath[0])
    const cleanup = () => {
      delete root.dataset.magicuiThemeVt
      root.style.removeProperty("--magicui-theme-toggle-vt-duration")
      root.style.removeProperty("--magicui-theme-vt-clip-from")
    }

    // @ts-ignore
    const transition = document.startViewTransition(() => {
      flushSync(applyTheme)
    })
    if (typeof transition?.finished?.finally === "function") {
      transition.finished.finally(cleanup)
    } else {
      cleanup()
    }

    const ready = transition?.ready
    if (ready && typeof ready.then === "function") {
      ready.then(() => {
        document.documentElement.animate(
          {
            clipPath,
          },
          {
            duration,
            easing: "ease-in-out",
            fill: "forwards",
            pseudoElement: "::view-transition-new(root)",
          }
        )
      })
    }
  }, [fromCenter, duration, theme, setTheme])

  if (!mounted) {
    return (
      <button
        type="button"
        className={cn(
          "h-8 w-8 text-muted-foreground hover:text-foreground flex items-center justify-center rounded-md hover:bg-muted/50 transition-colors",
          className
        )}
        {...props}
      >
        <Moon className="h-4 w-4" />
      </button>
    )
  }

  const isDark = theme === "dark"

  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(
        "h-8 w-8 text-muted-foreground hover:text-foreground flex items-center justify-center rounded-md hover:bg-muted/50 transition-colors cursor-pointer",
        className
      )}
      {...props}
    >
      {isDark ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-violet-500" />}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
