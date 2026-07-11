import { describe, expect, it, vi } from 'vitest'

import {
  createAdminThemeModeTransition,
  resolveAdminThemeTransitionClipPath,
  runAdminThemeTransition,
  type AdminThemeTransitionDocument,
  type AdminThemeTransitionWindow,
} from '../../src/theme'

describe('resolveAdminThemeTransitionClipPath', () => {
  it('maps button center and end radius into the device pixel ratio coordinate space', () => {
    const result = resolveAdminThemeTransitionClipPath({
      rect: {
        left: 600,
        top: 20,
        width: 120,
        height: 40,
      },
      viewportWidth: 960,
      viewportHeight: 540,
      pixelRatio: 2,
    })

    const x = 1320
    const y = 80
    const radius = Math.hypot(Math.max(x, 1920 - x), Math.max(y, 1080 - y))

    expect(result).toEqual({
      from: `circle(0px at ${x}px ${y}px)`,
      to: `circle(${radius}px at ${x}px ${y}px)`,
    })
  })

  it('falls back to the viewport center and ignores invalid pixel ratios', () => {
    const result = resolveAdminThemeTransitionClipPath({
      rect: null,
      viewportWidth: 800,
      viewportHeight: 600,
      pixelRatio: 0,
    })

    const x = 400
    const y = 300
    const radius = 500

    expect(result).toEqual({
      from: `circle(0px at ${x}px ${y}px)`,
      to: `circle(${radius}px at ${x}px ${y}px)`,
    })
  })

  it('runs the update immediately when reduced motion is preferred', () => {
    const update = vi.fn()
    const documentRef = {
      documentElement: { animate: vi.fn() },
      startViewTransition: vi.fn(),
    } as unknown as AdminThemeTransitionDocument
    const windowRef = {
      innerWidth: 800,
      innerHeight: 600,
      matchMedia: () => ({ matches: true }) as MediaQueryList,
    }

    const transition = runAdminThemeTransition({
      update,
      windowRef,
      documentRef,
    })

    expect(transition).toBeUndefined()
    expect(update).toHaveBeenCalledTimes(1)
    expect(documentRef.startViewTransition).not.toHaveBeenCalled()
  })

  it('starts a view transition and animates from the scaled target center', async () => {
    const update = vi.fn()
    const animate = vi.fn()
    const transition = { ready: Promise.resolve() }
    const documentRef = {
      documentElement: { animate },
      startViewTransition: vi.fn((callback) => {
        callback()
        return transition
      }),
    } as unknown as AdminThemeTransitionDocument
    const windowRef: AdminThemeTransitionWindow = {
      innerWidth: 960,
      innerHeight: 540,
      devicePixelRatio: 2,
      matchMedia: () => ({ matches: false }) as MediaQueryList,
    }

    runAdminThemeTransition({
      target: {
        getBoundingClientRect: () => ({
          left: 600,
          top: 20,
          width: 120,
          height: 40,
        }),
      },
      update,
      windowRef,
      documentRef,
    })
    await transition.ready
    await Promise.resolve()

    const x = 1320
    const y = 80
    const radius = Math.hypot(Math.max(x, 1920 - x), Math.max(y, 1080 - y))

    expect(update).toHaveBeenCalledTimes(1)
    expect(animate).toHaveBeenCalledWith(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${radius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 420,
        easing: 'cubic-bezier(.2, 0, 0, 1)',
        pseudoElement: '::view-transition-new(root)',
      },
    )
  })

  it('creates a theme mode click handler that toggles mode and reads the event target', async () => {
    let mode: 'light' | 'dark' = 'light'
    const animate = vi.fn()
    const transition = { ready: Promise.resolve() }
    const documentRef = {
      documentElement: { animate },
      startViewTransition: vi.fn((callback) => {
        callback()
        return transition
      }),
    } as unknown as AdminThemeTransitionDocument
    const windowRef: AdminThemeTransitionWindow = {
      innerWidth: 960,
      innerHeight: 540,
      devicePixelRatio: 2,
      matchMedia: () => ({ matches: false }) as MediaQueryList,
    }
    const handler = createAdminThemeModeTransition({
      getMode: () => mode,
      setMode: (nextMode) => { mode = nextMode },
      windowRef,
      documentRef,
    })
    const button = {
      getBoundingClientRect: () => ({
        left: 600,
        top: 20,
        width: 120,
        height: 40,
      }),
    } as EventTarget & AdminThemeTransitionWindow & { getBoundingClientRect: () => DOMRect }
    const event = { currentTarget: button } as unknown as Event

    handler(event)
    await transition.ready
    await Promise.resolve()

    expect(mode).toBe('dark')
    expect(animate).toHaveBeenCalled()
  })

  it('creates a theme mode handler that can switch to an explicit target mode', async () => {
    let mode: 'light' | 'dark' | 'system' = 'light'
    const transition = { ready: Promise.resolve() }
    const documentRef = {
      documentElement: { animate: vi.fn() },
      startViewTransition: vi.fn((callback) => {
        callback()
        return transition
      }),
    } as unknown as AdminThemeTransitionDocument
    const windowRef: AdminThemeTransitionWindow = {
      innerWidth: 800,
      innerHeight: 600,
      matchMedia: () => ({ matches: false }) as MediaQueryList,
    }
    const handler = createAdminThemeModeTransition({
      getMode: () => mode,
      setMode: (nextMode) => { mode = nextMode },
      modes: ['light', 'dark'],
      windowRef,
      documentRef,
    })

    handler.to('system')
    await transition.ready

    expect(mode).toBe('system')
    expect(documentRef.startViewTransition).toHaveBeenCalledTimes(1)
  })
})
