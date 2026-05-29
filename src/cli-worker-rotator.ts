import type { ChildProcessByStdio } from "child_process";
import * as rxjs from "rxjs";
import type { Readable, Writable } from "stream";
import { makeLineReader } from "./line-reader.js";
import { makeWorkerRotator, Worker, WorkerRotatorEvent } from "./worker-rotator.js";

export type CLIWorker = ChildProcessByStdio<Writable, Readable, null>
export type CLIWorkerRotatorEvent = WorkerRotatorEvent<CLIWorker>

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
  maxPendingRequests,
  onEvent
}: CLIWorkerRotatorOptions) {
  return makeWorkerRotator({
    makeWorker: () => makeWorker(spawnWorkerProcess),
    workerTtlMs,
    request$,
    maxPendingRequests,
    onEvent: event => onEvent?.({ ...event, worker: event.worker.child } as CLIWorkerRotatorEvent)
  })
}

async function makeWorker(spawn: () => CLIWorker): Promise<Worker<CLIRequest> & { child: CLIWorker }> {
  const child = spawn()
  await new Promise<void>((f, r) => child.once('spawn', f).once('error', r))
  return {
    child,
    process(request$) {
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
