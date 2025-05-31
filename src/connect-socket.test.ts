import { connectSocket } from './connect-socket'
import * as rxjs from "rxjs"

connectSocket({ host: '127.0.0.1', port: 8080, encoding: 'utf8' }).pipe(
  rxjs.tap({
    error(err) {
      console.error("Socket connect fail", err)
    }
  }),
  rxjs.retry({ delay: 10000 }),
  rxjs.exhaustMap(conn => {
    console.info("Socket connected")
    const write = (text: string) => {
      console.log('Socket write:', text)
      conn.write(text)
    }
    return rxjs.merge(
      conn.data$.pipe(
        rxjs.tap(chunk => console.log('Socket recv:', chunk))
      ),
      conn.error$.pipe(
        rxjs.tap(err => console.info('Socket error:', err))
      )
    ).pipe(
      rxjs.takeUntil(
        conn.close$.pipe(
          rxjs.tap(reason => console.info('Socket close:', reason))
        )
      ),
      rxjs.finalize(() => conn.end()),
      rxjs.ignoreElements(),
      rxjs.startWith({ write }),
      rxjs.endWith(null)
    )
  }),
  rxjs.repeat({ delay: 1000, count: 2 })
).subscribe(conn => {
  conn?.write("GET / HTTP/1.1\n\n")
})
