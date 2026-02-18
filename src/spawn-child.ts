import { ChildProcess } from "child_process"
import * as rxjs from "rxjs"

export function spawnChild<T extends ChildProcess>(spawn: () => T) {
  const child = spawn()
  return rxjs.race(
    rxjs.fromEvent(child, 'error', (err: Error) => err).pipe(
      rxjs.map(err => { throw err })
    ),
    rxjs.fromEvent(child, 'spawn').pipe(
      rxjs.take(1),
      rxjs.map(() => ({
        process: child,
        stdout$: child.stdout
          ? rxjs.fromEvent(child.stdout, 'data') as rxjs.Observable<string | Buffer>
          : rxjs.EMPTY,
        stderr$: child.stderr
          ? rxjs.fromEvent(child.stderr, 'data') as rxjs.Observable<string | Buffer>
          : rxjs.EMPTY,
        error$: rxjs.fromEvent(child, 'error') as rxjs.Observable<Error>,
        close$: rxjs.fromEvent(child, 'close', (code: number, signal?: NodeJS.Signals) => signal || code).pipe(
          rxjs.take(1)
        ),
      }))
    )
  )
}
