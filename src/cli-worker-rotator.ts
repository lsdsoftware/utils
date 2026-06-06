import type { ChildProcessByStdio } from "child_process";
import * as rxjs from "rxjs";
import type { Readable, Writable } from "stream";
import { makeLineReader } from "./line-reader.js";

export type CLIWorker = ChildProcessByStdio<Writable, Readable, null>

export type CLIWorkerRotatorEvent = {
  type: 'hired'|'relieved',
  worker: CLIWorker
} | {
  type: 'quit'
  worker: CLIWorker
  reason: unknown
}

export interface CLIRequest {
  input: string
  output$: rxjs.SubjectLike<string>
}

export interface CLIWorkerRotatorOptions {
  spawnWorkerProcess: () => CLIWorker
  workerTtlMs: number
  request$: rxjs.Observable<CLIRequest>
  maxPendingRequests?: number
  onEvent?: (event: CLIWorkerRotatorEvent) => void
}

/**
 * Rotates child processes that communicate over stdin/stdout using a
 * line-oriented request/response protocol, such as JSONL.
 * See the README for the protocol and lifecycle contract.
 */
export function makeCLIWorkerRotator({
  spawnWorkerProcess,
  workerTtlMs,
  request$,
  maxPendingRequests = Infinity,
  onEvent
}: CLIWorkerRotatorOptions) {
  return rxjs.defer(() => {
    if (maxPendingRequests !== Infinity && (!Number.isInteger(maxPendingRequests) || maxPendingRequests < 0)) {
      throw new RangeError('maxPendingRequests must be a non-negative integer or Infinity')
    }
    return rxjs.defer(() => makeWorker(spawnWorkerProcess)).pipe(
      rxjs.tap(worker => onEvent?.({ type: 'hired', worker: worker.child })),
      rxjs.exhaustMap(worker =>
        rxjs.NEVER.pipe(
          rxjs.startWith(worker),
          rxjs.takeUntil(
            rxjs.race(
              worker.quit$,
              rxjs.timer(workerTtlMs).pipe(
                rxjs.map(() => 'Worker TTL expired')
              )
            ).pipe(
              rxjs.tap(reason => onEvent?.({ type: 'quit', worker: worker.child, reason }))
            )
          ),
          rxjs.endWith(null),
          rxjs.finalize(() => {
            worker.relieve()
            onEvent?.({ type: 'relieved', worker: worker.child })
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
          [] as CLIRequest[]
        ),
        rxjs.ignoreElements()
      )
    )
  })
}

async function makeWorker(spawn: () => CLIWorker) {
  const child = spawn()
  await new Promise<void>((f, r) => child.once('spawn', f).once('error', r))
  return {
    child,
    process(request$: rxjs.Observable<CLIRequest>) {
      return request$.pipe(
        rxjs.mergeMap(request =>
          writeLn(child.stdin, request.input).pipe(
            rxjs.map(() => request),
            rxjs.catchError(err => {
              request.output$.error(err)
              return rxjs.EMPTY
            })
          )
        ),
        rxjs.zipWith(
          readLines(child.stdout)
        ),
        rxjs.tap(([request, line]) => request.output$.next(line)),
        rxjs.ignoreElements()
      )
    },
    relieve() {
      child.stdin.end()
    },
    quit$: rxjs.race(
      rxjs.fromEvent(child, 'close', (code: number, signal: string) => `Worker exit ${signal || code}`),
      rxjs.fromEvent(child.stdin, 'error', err => new Error('Worker stdin error', { cause: err }))
    )
  }
}

function readLines(stream: Readable) {
  return new rxjs.Observable<string>(subscriber => {
    const lineReader = makeLineReader(line => subscriber.next(line))
    const onError = (err: Error) => subscriber.error(err)
    const onFinish = () => subscriber.complete()

    lineReader.once('error', onError)
    lineReader.once('finish', onFinish)
    stream.once('error', onError)
    stream.pipe(lineReader)

    return () => {
      lineReader.off('error', onError)
      lineReader.off('finish', onFinish)
      stream.off('error', onError)
      stream.unpipe(lineReader)
      lineReader.destroy()
    }
  })
}

function writeLn(stream: Writable, line: string) {
  return new rxjs.Observable<void>(subscriber => {
    try {
      stream.write(line + "\n", err => {
        if (err) {
          subscriber.error(err)
        } else {
          subscriber.next()
          subscriber.complete()
        }
      })
    } catch (err) {
      subscriber.error(err)
    }
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
