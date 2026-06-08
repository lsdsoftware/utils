import { describe, expect } from "@service-broker/test-utils"
import assert from "assert"
import { EventEmitter } from "events"
import { createRequire, syncBuiltinESMExports } from "module"
import * as rxjs from "rxjs"
import { connectSocket } from './connect-socket.js'

describe('connect-socket', ({ test }) => {

  test('fail', () =>
    rxjs.lastValueFrom(
      connectSocket({ port: -1 })
    ).then(
      () => assert(false, '!throw'),
      err => expect(err.code, 'ERR_SOCKET_BAD_PORT')
    )
  )

  test('success', () =>
    rxjs.lastValueFrom(
      connectSocket({ host: 'lsdsoftware.com', port: 80, encoding: 'utf8', timeout: 100 }).pipe(
        rxjs.exhaustMap(conn =>
          rxjs.forkJoin({
            request: rxjs.timer(120).pipe(
              rxjs.tap(() => {
                conn.socket.write('GET / HTTP/1.1\nHost: lsdsoftware.com\n\n')
                conn.socket.end()
              })
            ),
            response: conn.data$.pipe(
              rxjs.takeUntil(conn.close$),
              rxjs.reduce((acc, chunk) => {
                assert(typeof chunk == 'string')
                return acc.concat(chunk)
              }, ''),
            ),
            errors: conn.error$.pipe(
              rxjs.takeUntil(conn.close$),
              rxjs.reduce((acc, err) => acc.concat(err), [] as Error[])
            ),
            timeouts: conn.timeout$.pipe(
              rxjs.takeUntil(conn.close$),
              rxjs.reduce(acc => acc + 1, 0)
            ),
            closedWithError: conn.close$
          })
        )
      )
    ).then(({ response, errors, timeouts, closedWithError }) => {
      assert(response.startsWith('HTTP/1.1 301'))
      expect(errors, [])
      expect(timeouts, 1)
      expect(closedWithError, false)
    })
  )

  test('aborts pending socket on unsubscribe', async () => {
    const require = createRequire(import.meta.url)
    const net = require('net') as typeof import('net')
    const originalCreateConnection = net.createConnection
    let signal: AbortSignal | undefined
    let aborts = 0

    try {
      net.createConnection = ((options: { signal?: AbortSignal }) => {
        assert(typeof options == 'object')
        signal = options.signal
        signal?.addEventListener('abort', () => aborts++)

        return Object.assign(new EventEmitter(), {
          setEncoding: () => undefined
        })
      }) as unknown as typeof originalCreateConnection
      syncBuiltinESMExports()

      const { connectSocket } = await import(`./connect-socket.js?abort-test=${Date.now()}`)
      const subscription = connectSocket({ port: 80 }).subscribe()

      assert(signal)
      expect(signal.aborted, false)

      subscription.unsubscribe()

      expect(signal.aborted, true)
      expect(aborts, 1)
    } finally {
      net.createConnection = originalCreateConnection
      syncBuiltinESMExports()
    }
  })
})
