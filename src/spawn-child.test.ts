import * as rxjs from "rxjs"
import { spawnChild } from "./spawn-child"

spawnChild('cat').pipe(
  rxjs.tap({
    error(err) {
      console.error("Child spawn fail", err)
    }
  }),
  rxjs.retry({ delay: 10000 }),
  rxjs.exhaustMap(child => {
    console.info("Child spawned", child.pid)
    const write = (text: string) => {
      console.log("Child write:", text)
      child.stdin.write(text)
    }
    return rxjs.merge(
      child.stdout$.pipe(
        rxjs.tap(data => console.log("Child stdout:", data.toString()))
      ),
      child.stderr$.pipe(
        rxjs.tap(data => console.log("Child stderr:", data.toString()))
      ),
      child.error$.pipe(
        rxjs.tap(err => console.info("Child error:", err))
      )
    ).pipe(
      rxjs.takeUntil(
        child.close$.pipe(
          rxjs.tap(code => console.log("Child close:", code))
        )
      ),
      rxjs.finalize(() => child.kill()),
      rxjs.ignoreElements(),
      rxjs.startWith({ write }),
      rxjs.endWith(null)
    )
  }),
  rxjs.repeat({ delay: 1000, count: 2 }),

  rxjs.switchMap(child =>
    rxjs.iif(
      () => child != null,
      rxjs.fromEvent(process.stdin, 'data', (data: Buffer) => data).pipe(
        rxjs.tap(data => child!.write(data.toString().trim()))
      ),
      rxjs.EMPTY
    )
  )
).subscribe({
  complete() {
    process.stdin.pause()
  }
})
