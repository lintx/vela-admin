import type { AdminConfig } from '../app/define-admin-config'
import { cloneAdminConfig } from './settings-service-utils'

type SaveJobKind = 'auto' | 'manual' | 'retry' | 'dispose'

interface SaveWaiter {
  resolve: (settings: AdminConfig) => void
  reject: (error: unknown) => void
}

interface SaveJob {
  kind: SaveJobKind
  snapshot: AdminConfig
  fullRevision: number
  version: number
  waiters: SaveWaiter[]
}

export interface SettingsSaveCoordinatorOptions {
  save?: (settings: AdminConfig) => Promise<void>
  debounce: number
  getSettings: () => AdminConfig
  onSaveStart: () => number
  onSaveSuccess: (generation: number) => void
  onSaveError: (error: unknown, settings: AdminConfig, generation: number) => void
  onStateChange: () => void
}

export interface SettingsSaveCoordinator {
  readonly isSaving: boolean
  readonly isScheduled: boolean
  readonly hasPending: boolean
  captureCurrent(settings: AdminConfig): number
  markAutoDirty(settings: AdminConfig, fullRevision: number): void
  sync(settings: AdminConfig, fullRevision: number): Promise<AdminConfig>
  retry(settings: AdminConfig, fullRevision: number): Promise<AdminConfig>
  dispose(): Promise<AdminConfig>
}

export function createSettingsSaveCoordinator(
  options: SettingsSaveCoordinatorOptions,
): SettingsSaveCoordinator {
  const jobs: SaveJob[] = []
  let activeJob: SaveJob | undefined
  let syncTimer: ReturnType<typeof setTimeout> | undefined
  let currentFullSnapshot = cloneAdminConfig(options.getSettings())
  let currentFullRevision = 0
  let autoSnapshot = cloneAdminConfig(currentFullSnapshot)
  let autoFullRevision = 0
  let localVersion = 0
  let lastSavedVersion = 0
  let workerRunning = false
  let disposalPromise: Promise<AdminConfig> | undefined

  function notifyStateChange() {
    options.onStateChange()
  }

  function clearTimer() {
    if (syncTimer !== undefined) {
      clearTimeout(syncTimer)
      syncTimer = undefined
    }
  }

  function createJob(
    kind: SaveJobKind,
    snapshot: AdminConfig,
    fullRevision: number,
    version: number,
  ): SaveJob {
    return {
      kind,
      snapshot: cloneAdminConfig(snapshot),
      fullRevision,
      version,
      waiters: [],
    }
  }

  function createAutoJob(kind: 'auto' | 'dispose'): SaveJob {
    return createJob(kind, autoSnapshot, autoFullRevision, localVersion)
  }

  function createFullJob(
    kind: 'manual' | 'retry',
    settings: AdminConfig,
    fullRevision: number,
  ): SaveJob {
    const snapshot = fullRevision === currentFullRevision
      ? currentFullSnapshot
      : settings
    return createJob(kind, snapshot, fullRevision, localVersion)
  }

  function waitForJob(job: SaveJob): Promise<AdminConfig> {
    return new Promise((resolve, reject) => {
      job.waiters.push({ resolve, reject })
    })
  }

  function settleSuccess(job: SaveJob) {
    const settings = options.getSettings()
    for (const waiter of job.waiters) {
      waiter.resolve(settings)
    }
  }

  function settleFailure(job: SaveJob, error: unknown) {
    for (const waiter of job.waiters) {
      waiter.reject(error)
    }
  }

  async function drain() {
    while (jobs.length > 0) {
      const job = jobs.shift()!
      activeJob = job
      const generation = options.onSaveStart()
      notifyStateChange()

      try {
        await options.save!(cloneAdminConfig(job.snapshot))
        lastSavedVersion = Math.max(lastSavedVersion, job.version)
        options.onSaveSuccess(generation)
        settleSuccess(job)
      } catch (error) {
        options.onSaveError(error, cloneAdminConfig(job.snapshot), generation)
        settleFailure(job, error)
      } finally {
        activeJob = undefined
        notifyStateChange()
      }
    }

    workerRunning = false
    notifyStateChange()
  }

  function startWorker() {
    if (workerRunning || !options.save) {
      return
    }

    // 必须先登记 worker，再执行 adapter，避免同步重入时误判队列为空。
    workerRunning = true
    notifyStateChange()
    void drain()
  }

  function enqueueJob(job: SaveJob): SaveJob {
    jobs.push(job)
    startWorker()
    return job
  }

  function enqueueAuto() {
    const queued = jobs.at(-1)
    if (queued?.kind === 'auto') {
      queued.snapshot = cloneAdminConfig(autoSnapshot)
      queued.fullRevision = autoFullRevision
      queued.version = localVersion
      notifyStateChange()
      return
    }

    enqueueJob(createAutoJob('auto'))
  }

  function latestQueuedJob(): SaveJob | undefined {
    return jobs.at(-1)
  }

  function enqueueFullIntent(
    kind: 'manual' | 'retry',
    settings: AdminConfig,
    fullRevision: number,
  ): Promise<AdminConfig> {
    const job = createFullJob(kind, settings, fullRevision)
    const promise = waitForJob(job)
    enqueueJob(job)
    return promise
  }

  function sync(settings: AdminConfig, fullRevision: number): Promise<AdminConfig> {
    clearTimer()
    if (!options.save) {
      notifyStateChange()
      return Promise.resolve(options.getSettings())
    }

    const queued = latestQueuedJob()
    if (queued && queued.fullRevision >= fullRevision) {
      notifyStateChange()
      return waitForJob(queued)
    }

    if (activeJob && activeJob.fullRevision >= fullRevision) {
      notifyStateChange()
      return waitForJob(activeJob)
    }

    return enqueueFullIntent('manual', settings, fullRevision)
  }

  function retry(settings: AdminConfig, fullRevision: number): Promise<AdminConfig> {
    clearTimer()
    if (!options.save) {
      notifyStateChange()
      return Promise.resolve(options.getSettings())
    }

    const queued = latestQueuedJob()
    if (queued && queued.fullRevision >= fullRevision) {
      notifyStateChange()
      return waitForJob(queued)
    }

    return enqueueFullIntent('retry', settings, fullRevision)
  }

  function dispose(): Promise<AdminConfig> {
    if (disposalPromise) {
      return disposalPromise
    }

    clearTimer()
    if (!options.save) {
      disposalPromise = Promise.resolve(options.getSettings())
      notifyStateChange()
      return disposalPromise
    }

    const queued = latestQueuedJob()
    if (queued && queued.version >= localVersion) {
      disposalPromise = waitForJob(queued)
    } else if (activeJob && activeJob.version >= localVersion) {
      disposalPromise = waitForJob(activeJob)
    } else if (localVersion > lastSavedVersion) {
      const job = createAutoJob('dispose')
      disposalPromise = waitForJob(job)
      enqueueJob(job)
    } else {
      disposalPromise = Promise.resolve(options.getSettings())
    }

    notifyStateChange()
    return disposalPromise
  }

  return {
    get isSaving() {
      return activeJob !== undefined
    },
    get isScheduled() {
      return syncTimer !== undefined
    },
    get hasPending() {
      return jobs.length > 0
    },
    captureCurrent(settings) {
      currentFullRevision += 1
      currentFullSnapshot = cloneAdminConfig(settings)
      return currentFullRevision
    },
    markAutoDirty(settings, fullRevision) {
      localVersion += 1
      autoSnapshot = cloneAdminConfig(settings)
      autoFullRevision = fullRevision
      if (!options.save) {
        return
      }

      if (workerRunning) {
        enqueueAuto()
        return
      }

      clearTimer()
      syncTimer = setTimeout(() => {
        syncTimer = undefined
        enqueueAuto()
      }, options.debounce)
      notifyStateChange()
    },
    sync,
    retry,
    dispose,
  }
}
