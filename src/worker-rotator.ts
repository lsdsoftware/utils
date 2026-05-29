import * as rxjs from "rxjs"

export interface Worker<R> {
  process(request$: rxjs.Observable<R>): rxjs.Observable<never>
  relieve(): void
  quit$: rxjs.Observable<unknown>
}

export type WorkerRotatorEvent<W> = {
  type: 'hired'|'expired'|'relieved',
  worker: W
} | {
  type: 'quit'
  worker: W
  reason: unknown
}

export interface WorkerRotatorOptions<R, W extends Worker<R>> {
  makeWorker: () => Promise<W>
  workerTtlMs: number
  request$: rxjs.Observable<R>
  maxPendingRequests?: number
  onEvent?: (event: WorkerRotatorEvent<W>) => void
}

/**
 * Rotates workers over a request stream.
 * See the README for the lifecycle and buffering contract.
 */
export function makeWorkerRotator<R, W extends Worker<R>>({
  makeWorker,
  workerTtlMs,
  request$,
  maxPendingRequests = Infinity,
  onEvent
}: WorkerRotatorOptions<R, W>) {
  return rxjs.defer(() => {
    if (maxPendingRequests !== Infinity && (!Number.isInteger(maxPendingRequests) || maxPendingRequests < 0)) {
      throw new RangeError('maxPendingRequests must be a non-negative integer or Infinity')
    }
    return rxjs.defer(() => makeWorker()).pipe(
      rxjs.tap(worker => onEvent?.({ type: 'hired', worker })),
      rxjs.exhaustMap(worker =>
        rxjs.NEVER.pipe(
          rxjs.startWith(worker),
          rxjs.takeUntil(
            rxjs.race(
              worker.quit$.pipe(
                rxjs.tap(reason => onEvent?.({ type: 'quit', worker, reason }))
              ),
              rxjs.timer(workerTtlMs).pipe(
                rxjs.tap(() => onEvent?.({ type: 'expired', worker }))
              )
            )
          ),
          rxjs.endWith(null),
          rxjs.finalize(() => {
            worker.relieve()
            onEvent?.({ type: 'relieved', worker })
          })
        )
      ),
      rxjs.repeat(),
      rxjs.share(),
      worker$ => request$.pipe(
        rxjs.window(worker$),
        rxjs.zipWith(
          worker$.pipe(
            rxjs.startWith(null)
          )
        ),
        rxjs.mergeScan(
          (pending, [window$, worker]) => rxjs.concat(pending, window$).pipe(
            worker
              ? request$ => worker.process(request$).pipe(rxjs.startWith([]))
              : request$ => request$.pipe(bufferRequests(maxPendingRequests))
          ),
          [] as R[]
        ),
        rxjs.ignoreElements()
      )
    )
  })
}

function bufferRequests<R>(maxPendingRequests: number): rxjs.OperatorFunction<R, R[]> {
  return request$ => request$.pipe(
    rxjs.reduce((pending, request) => {
      if (pending.length >= maxPendingRequests) {
        throw new Error(`Worker rotator exceeded max pending requests (${maxPendingRequests})`)
      }
      pending.push(request)
      return pending
    }, [] as R[])
  )
}
