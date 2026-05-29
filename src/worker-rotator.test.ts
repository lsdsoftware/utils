import { describe } from "@service-broker/test-utils"
import assert from "assert"
import * as rxjs from "rxjs"
import { makeWorkerRotator, Worker, WorkerRotatorEvent } from "./worker-rotator.js"

describe('worker-rotator', ({ test }) => {

  test('buffers requests before the first worker is ready', async () => {
    const request$ = new rxjs.Subject<number>
    const worker = makeTestWorker<number>()
    const workerReady = defer<Worker<number>>()
    const processed: number[] = []

    worker.processRequests$.subscribe(request => processed.push(request))

    const subscription = makeWorkerRotator({
      makeWorker: () => workerReady.promise,
      workerTtlMs: 1000,
      request$
    }).subscribe()

    try {
      request$.next(1)
      request$.next(2)
      workerReady.resolve(worker)

      await waitFor(() => processed.length == 2)

      assert.deepStrictEqual(processed, [1, 2])
    } finally {
      subscription.unsubscribe()
    }
  })

  test('buffers requests between workers', async () => {
    const request$ = new rxjs.Subject<number>
    const firstWorker = makeTestWorker<number>()
    const secondWorker = makeTestWorker<number>()
    const firstWorkerReady = defer<Worker<number>>()
    const secondWorkerReady = defer<Worker<number>>()
    const workersReady = [firstWorkerReady, secondWorkerReady]
    const processed: number[] = []

    firstWorker.processRequests$.subscribe(request => processed.push(request))
    secondWorker.processRequests$.subscribe(request => processed.push(request))

    const subscription = makeWorkerRotator({
      makeWorker: () => workersReady.shift()!.promise,
      workerTtlMs: 1000,
      request$
    }).subscribe()

    try {
      firstWorkerReady.resolve(firstWorker)
      await waitFor(() => firstWorker.processCalls == 1)
      request$.next(1)
      firstWorker.quit$.next('done')
      request$.next(2)
      secondWorkerReady.resolve(secondWorker)

      await waitFor(() => processed.length == 2)

      assert.deepStrictEqual(processed, [1, 2])
      assert(firstWorker.relieved)
    } finally {
      subscription.unsubscribe()
    }
  })

  test('errors when pending request cap is exceeded', async () => {
    const request$ = new rxjs.Subject<number>
    const workerReady = defer<Worker<number>>()
    const error = defer<unknown>()

    makeWorkerRotator({
      makeWorker: () => workerReady.promise,
      workerTtlMs: 1000,
      request$,
      maxPendingRequests: 1
    }).subscribe({
      error: err => error.resolve(err)
    })

    request$.next(1)
    request$.next(2)

    const err = await error.promise
    assert(err instanceof Error)
    assert.equal(err.message, 'Worker rotator exceeded max pending requests (1)')
  })

  test('reports lifecycle events', async () => {
    const request$ = new rxjs.Subject<number>
    const worker = makeTestWorker<number>()
    const events: WorkerRotatorEvent<Worker<number>>[] = []

    const subscription = makeWorkerRotator({
      makeWorker: async () => worker,
      workerTtlMs: 1000,
      request$,
      onEvent: event => events.push(event)
    }).subscribe()

    try {
      await waitFor(() => events.length >= 1)
      worker.quit$.next('done')
      await waitFor(() => events.length >= 3)

      assert.deepStrictEqual(events.slice(0, 3).map(event => event.type), ['hired', 'quit', 'relieved'])
      assert.equal(events[1].type == 'quit' && events[1].reason, 'done')
    } finally {
      subscription.unsubscribe()
    }
  })
})

function makeTestWorker<R>(): Worker<R> & {
  processCalls: number
  processRequests$: rxjs.Subject<R>
  quit$: rxjs.Subject<unknown>
  relieved: boolean
} {
  const processRequests$ = new rxjs.Subject<R>
  return {
    processCalls: 0,
    processRequests$,
    quit$: new rxjs.Subject<unknown>(),
    relieved: false,
    process(request$) {
      this.processCalls++
      return request$.pipe(
        rxjs.tap(request => processRequests$.next(request)),
        rxjs.ignoreElements()
      )
    },
    relieve() {
      this.relieved = true
    }
  }
}

function defer<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

async function waitFor(condition: () => boolean) {
  for (let i = 0; i < 100; i++) {
    if (condition()) return
    await new Promise(resolve => setTimeout(resolve, 1))
  }
  assert(condition())
}
