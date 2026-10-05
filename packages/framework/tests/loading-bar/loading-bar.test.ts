import { LoadingBar } from '@varlet/ui'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  adminLoadingBar,
  createAdminLoadingBar,
  useAdminLoadingBar,
} from '../../src/loading-bar'

describe('admin loading bar', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('delegates manual controls to Varlet LoadingBar', () => {
    const start = vi.spyOn(LoadingBar, 'start').mockImplementation(() => undefined)
    const finish = vi.spyOn(LoadingBar, 'finish').mockImplementation(() => undefined)
    const error = vi.spyOn(LoadingBar, 'error').mockImplementation(() => undefined)
    const setDefaultOptions = vi.spyOn(LoadingBar, 'setDefaultOptions').mockImplementation(() => undefined)
    const resetDefaultOptions = vi.spyOn(LoadingBar, 'resetDefaultOptions').mockImplementation(() => undefined)
    const service = createAdminLoadingBar()

    service.start()
    service.finish()
    service.error()
    service.setDefaultOptions({ height: '4px' })
    service.resetDefaultOptions()

    expect(start).toHaveBeenCalledOnce()
    expect(finish).toHaveBeenCalledOnce()
    expect(error).toHaveBeenCalledOnce()
    expect(setDefaultOptions).toHaveBeenCalledWith({ height: '4px' })
    expect(resetDefaultOptions).toHaveBeenCalledOnce()
  })

  it('returns the shared service from the composable', () => {
    expect(useAdminLoadingBar()).toBe(adminLoadingBar)
  })
})
