import { NetConnectOpts, Socket, createConnection } from "net"
import * as rxjs from "rxjs"
import { finalizeWithReason } from "./finalize-with-reason.js"

export interface Connection {
  socket: Socket
  data$: rxjs.Observable<string | Buffer>
  error$: rxjs.Observable<Error>
  timeout$: rxjs.Observable<void>
  close$: rxjs.Observable<boolean>
}

export function connectSocket(options: NetConnectOpts & {
  encoding?: BufferEncoding
}) {
  return rxjs.defer(() => {
    const abortCtl = new AbortController()
    const callerSignal = options.signal
    if (callerSignal?.aborted) abortCtl.abort(callerSignal.reason)

    const sock = createConnection({ ...options, signal: abortCtl.signal })
    if (options.encoding) sock.setEncoding(options.encoding)
    const conn = makeConnection(sock)

    // Caller cancellation is forwarded only until the socket reaches its terminal
    // close event, which also removes the abort listener for long-lived signals.
    if (callerSignal && !callerSignal.aborted) {
      rxjs.fromEvent(callerSignal, 'abort', () => callerSignal.reason).pipe(
        rxjs.takeUntil(conn.close$)
      ).subscribe(reason => abortCtl.abort(reason))
    }

    return rxjs.race(
      conn.error$.pipe(
        rxjs.map(err => { throw err })
      ),
      rxjs.fromEvent(sock, 'connect').pipe(
        rxjs.take(1),
        rxjs.map(() => conn)
      )
    ).pipe(
      // If the caller unsubscribes from a pending connection, the underlying
      // error/close handling must remain active while abort teardown finishes.
      rxjs.share({ resetOnRefCountZero: false }),
      finalizeWithReason(reason => {
        if (reason == 'unsubscribe') abortCtl.abort()
      })
    )
  })
}

function makeConnection(sock: Socket): Connection {
  return {
    socket: sock,
    data$: rxjs.fromEvent(sock, 'data', (chunk: string | Buffer) => chunk).pipe(
      rxjs.takeUntil(
        rxjs.fromEvent(sock, 'end')
      )
    ),
    error$: rxjs.fromEvent(sock, 'error', (err: Error) => err),
    timeout$: rxjs.fromEvent(sock, 'timeout', () => {}),
    // close$ is the terminal lifecycle fence. It is intentionally one-shot and
    // replayable to late subscribers so cleanup paths cannot miss it.
    close$: rxjs.from(new Promise<boolean>(f => sock.once('close', f))),
  }
}
