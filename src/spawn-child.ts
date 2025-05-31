import { ChildProcessWithoutNullStreams, spawn, SpawnOptionsWithoutStdio } from "child_process";
import * as rxjs from "rxjs";

export interface Child {
  pid: number
  stdout$: rxjs.Observable<string | Buffer>
  stderr$: rxjs.Observable<string | Buffer>
  error$: rxjs.Observable<Error>
  close$: rxjs.Observable<number | NodeJS.Signals>
  stdin: ChildProcessWithoutNullStreams['stdin']
  kill: ChildProcessWithoutNullStreams['kill']
}

export function spawnChild(command: string, args?: string[], options?: SpawnOptionsWithoutStdio) {
  return rxjs.defer(() => {
    const childProc = spawn(command, args, options)
    return rxjs.race(
      rxjs.fromEvent(childProc, 'error', (err: Error) => err).pipe(
        rxjs.map(err => { throw err })
      ),
      rxjs.fromEvent(childProc, 'spawn').pipe(
        rxjs.take(1),
        rxjs.map(() => makeChild(childProc))
      )
    )
  })
}

function makeChild(childProc: ChildProcessWithoutNullStreams): Child {
  return {
    pid: childProc.pid!,
    stdout$: rxjs.fromEvent(childProc.stdout, 'data', (data: string | Buffer) => data),
    stderr$: rxjs.fromEvent(childProc.stderr, 'data', (data: string | Buffer) => data),
    error$: rxjs.fromEvent(childProc, 'error', (err: Error) => err),
    close$: rxjs.fromEvent(childProc, 'close', (code: number, signal?: NodeJS.Signals) => signal || code),
    stdin: childProc.stdin,
    kill: childProc.kill.bind(childProc)
  }
}
