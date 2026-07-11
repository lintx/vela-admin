export interface AdminThemeTransitionRect {
  left: number
  top: number
  width: number
  height: number
}

export interface ResolveAdminThemeTransitionClipPathOptions {
  rect?: AdminThemeTransitionRect | null
  viewportWidth: number
  viewportHeight: number
  pixelRatio?: number
}

export interface ResolvedAdminThemeTransitionClipPath {
  from: string
  to: string
}

export interface AdminThemeTransitionTarget {
  getBoundingClientRect: () => AdminThemeTransitionRect
}

export interface AdminThemeTransitionLike {
  ready: Promise<unknown>
}

export interface AdminThemeTransitionDocument {
  documentElement: {
    animate: (
      keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
      options?: KeyframeAnimationOptions,
    ) => Animation
  }
  startViewTransition?: (update: () => void) => AdminThemeTransitionLike
}

export interface AdminThemeTransitionWindow {
  innerWidth: number
  innerHeight: number
  devicePixelRatio?: number
  matchMedia?: (query: string) => MediaQueryList
}

export interface RunAdminThemeTransitionOptions {
  target?: AdminThemeTransitionTarget | null
  update: () => void
  windowRef?: AdminThemeTransitionWindow
  documentRef?: AdminThemeTransitionDocument
  duration?: number
  easing?: string
  pseudoElement?: string
}

export interface CreateAdminThemeModeTransitionOptions<TMode extends string = 'light' | 'dark'> {
  getMode: () => TMode
  setMode: (mode: TMode) => void
  modes?: readonly [TMode, TMode]
  windowRef?: AdminThemeTransitionWindow
  documentRef?: AdminThemeTransitionDocument
  duration?: number
  easing?: string
  pseudoElement?: string
}

export interface AdminThemeModeTransitionHandler<TMode extends string = 'light' | 'dark'> {
  (event?: Event | AdminThemeTransitionTarget | null): AdminThemeTransitionLike | undefined
  to: (mode: TMode, event?: Event | AdminThemeTransitionTarget | null) => AdminThemeTransitionLike | undefined
}

export function resolveAdminThemeTransitionClipPath({
  rect,
  viewportWidth,
  viewportHeight,
  pixelRatio = 1,
}: ResolveAdminThemeTransitionClipPathOptions): ResolvedAdminThemeTransitionClipPath {
  const scale = normalizePixelRatio(pixelRatio)
  const rawX = rect ? rect.left + rect.width / 2 : viewportWidth / 2
  const rawY = rect ? rect.top + rect.height / 2 : viewportHeight / 2
  const x = rawX * scale
  const y = rawY * scale
  const width = viewportWidth * scale
  const height = viewportHeight * scale
  const endRadius = Math.hypot(
    Math.max(x, width - x),
    Math.max(y, height - y),
  )

  return {
    from: `circle(0px at ${x}px ${y}px)`,
    to: `circle(${endRadius}px at ${x}px ${y}px)`,
  }
}

export function runAdminThemeTransition({
  target,
  update,
  windowRef = globalThis.window,
  documentRef = globalThis.document as unknown as AdminThemeTransitionDocument,
  duration = 420,
  easing = 'cubic-bezier(.2, 0, 0, 1)',
  pseudoElement = '::view-transition-new(root)',
}: RunAdminThemeTransitionOptions): AdminThemeTransitionLike | undefined {
  const reduceMotion = windowRef.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!documentRef.startViewTransition || reduceMotion) {
    update()
    return undefined
  }

  const rect = target?.getBoundingClientRect() ?? null
  const clipPath = resolveAdminThemeTransitionClipPath({
    rect,
    viewportWidth: windowRef.innerWidth,
    viewportHeight: windowRef.innerHeight,
    pixelRatio: windowRef.devicePixelRatio,
  })
  const transition = documentRef.startViewTransition(update)

  transition.ready.then(() => {
    documentRef.documentElement.animate(
      {
        clipPath: [
          clipPath.from,
          clipPath.to,
        ],
      },
      {
        duration,
        easing,
        pseudoElement,
      },
    )
  })

  return transition
}

export function createAdminThemeModeTransition<TMode extends string = 'light' | 'dark'>({
  getMode,
  setMode,
  modes = ['light', 'dark'] as unknown as readonly [TMode, TMode],
  windowRef,
  documentRef,
  duration,
  easing,
  pseudoElement,
}: CreateAdminThemeModeTransitionOptions<TMode>): AdminThemeModeTransitionHandler<TMode> {
  function runWithMode(mode: TMode, event?: Event | AdminThemeTransitionTarget | null) {
    return runAdminThemeTransition({
      target: resolveThemeTransitionTarget(event),
      update: () => setMode(mode),
      windowRef,
      documentRef,
      duration,
      easing,
      pseudoElement,
    })
  }

  const handler = ((event?: Event | AdminThemeTransitionTarget | null) => {
    const [lightMode, darkMode] = modes
    const nextMode = getMode() === lightMode ? darkMode : lightMode

    return runWithMode(nextMode, event)
  }) as AdminThemeModeTransitionHandler<TMode>

  handler.to = runWithMode

  return handler
}

function resolveThemeTransitionTarget(event?: Event | AdminThemeTransitionTarget | null): AdminThemeTransitionTarget | null {
  if (!event) {
    return null
  }

  if ('getBoundingClientRect' in event) {
    return event
  }

  const target = event.currentTarget

  return target && 'getBoundingClientRect' in target
    ? target as AdminThemeTransitionTarget
    : null
}

function normalizePixelRatio(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 1
}
