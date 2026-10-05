import { LoadingBar } from '@varlet/ui'

export interface AdminLoadingBarOptions {
  color?: string
  errorColor?: string
  height?: string | number
  top?: string | number
  finishDelay?: number
}

export interface AdminLoadingBarService {
  start(): void
  finish(): void
  error(): void
  setDefaultOptions(options: AdminLoadingBarOptions): void
  resetDefaultOptions(): void
}

function canUseLoadingBar(): boolean {
  return typeof window !== 'undefined'
}

export function createAdminLoadingBar(options: AdminLoadingBarOptions = {}): AdminLoadingBarService {
  if (Object.keys(options).length > 0) {
    LoadingBar.setDefaultOptions(options)
  }

  return {
    start() {
      if (canUseLoadingBar()) {
        LoadingBar.start()
      }
    },
    finish() {
      if (canUseLoadingBar()) {
        LoadingBar.finish()
      }
    },
    error() {
      if (canUseLoadingBar()) {
        LoadingBar.error()
      }
    },
    setDefaultOptions(nextOptions) {
      LoadingBar.setDefaultOptions(nextOptions)
    },
    resetDefaultOptions() {
      LoadingBar.resetDefaultOptions()
    },
  }
}

export const adminLoadingBar = createAdminLoadingBar()

export function useAdminLoadingBar(): AdminLoadingBarService {
  return adminLoadingBar
}
