import { NetConnectOpts, Socket, createConnection } from "net"
import * as rxjs from "rxjs"

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
    const sock = createConnection(options)
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
    socket: sock,
    data$: (rxjs.fromEvent(sock, 'data') as Connection['data$']).pipe(
      rxjs.takeUntil(
        rxjs.fromEvent(sock, 'end')
      )
    ),
    error$: rxjs.fromEvent(sock, 'error') as Connection['error$'],
    timeout$: rxjs.fromEvent(sock, 'timeout') as Connection['timeout$'],
    close$: (rxjs.fromEvent(sock, 'close') as Connection['close$']).pipe(
      rxjs.take(1)
    ),
  }
}
