import { createMemoryHistory } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'

import { createAdminRouter } from '../../src/router'

describe('createAdminRouter loading bar integration', () => {
  it('starts and finishes the configured loading bar around navigation', async () => {
    const loadingBar = createLoadingBarSpy()
    const router = createAdminRouter({
      pages: {
        './pages/index.vue': pageComponent('Home'),
        './pages/users.vue': pageComponent('Users'),
      },
      history: createMemoryHistory(),
      loadingBar,
    })

    await router.push('/users')

    expect(loadingBar.start).toHaveBeenCalledOnce()
    expect(loadingBar.finish).toHaveBeenCalledOnce()
    expect(loadingBar.error).not.toHaveBeenCalled()
  })

  it('reports navigation errors and supports disabling automatic loading', async () => {
    const loadingBar = createLoadingBarSpy()
    const router = createAdminRouter({
      pages: {
        './pages/index.vue': pageComponent('Home'),
        './pages/users.vue': pageComponent('Users'),
      },
      history: createMemoryHistory(),
      loadingBar,
    })
    const error = new Error('navigation failed')
    router.beforeEach(() => {
      throw error
    })

    await expect(router.push('/users')).rejects.toBe(error)
    expect(loadingBar.start).toHaveBeenCalledOnce()
    expect(loadingBar.error).toHaveBeenCalledOnce()

    const disabledRouter = createAdminRouter({
      pages: {
        './pages/index.vue': pageComponent('Home'),
      },
      history: createMemoryHistory(),
      loadingBar: false,
    })

    await expect(disabledRouter.push('/')).resolves.toBeUndefined()
  })
})

function createLoadingBarSpy() {
  return {
    start: vi.fn(),
    finish: vi.fn(),
    error: vi.fn(),
    setDefaultOptions: vi.fn(),
    resetDefaultOptions: vi.fn(),
  }
}

function pageComponent(name: string) {
  return {
    default: {
      name,
      template: `<main>${name}</main>`,
    },
  }
}
