import { NetConnectOpts, Socket, createConnection } from "net"
import * as rxjs from "rxjs"

export interface Connection {
  data$: rxjs.Observable<string | Buffer>
  error$: rxjs.Observable<Error>
  close$: rxjs.Observable<string>
  write: Socket['write']
  end: Socket['end']
}

export function connectSocket(options: NetConnectOpts & {
  timeout?: number
  encoding?: BufferEncoding
}) {
  return rxjs.defer(() => {
    const sock = createConnection(options)
    if (options.timeout) sock.setTimeout(options.timeout)
    if (options.encoding) sock.setEncoding(options.encoding)
    return rxjs.race(
      rxjs.fromEvent(sock, 'error').pipe(
        rxjs.map(err => { throw err })
      ),
      rxjs.fromEvent(sock, 'connect').pipe(
        rxjs.take(1),
        rxjs.map(() => makeConnection(sock))
      )
    )
  })
}

function makeConnection(sock: Socket): Connection {
  return {
    data$: rxjs.fromEvent(sock, 'data', (data: string | Buffer) => data).pipe(
      rxjs.takeUntil(
        rxjs.fromEvent(sock, 'end')
      )
    ),
    error$: rxjs.fromEvent(sock, 'error', (err: Error) => err),
    close$: rxjs.merge(
      rxjs.fromEvent(sock, 'close', (hadError: boolean) => hadError ? 'Normal close' : 'Close with error'),
      rxjs.fromEvent(sock, 'timeout', () => 'Socket timeout')
    ),
    write: sock.write.bind(sock),
    end: sock.end.bind(sock)
  }
}
