import { describe, expect } from "@service-broker/test-utils"
import assert from "assert"
import { spawn } from "child_process"
import * as rxjs from "rxjs"
import { spawnChild } from "./spawn-child.js"

describe('spawn-child', ({ test }) => {

  test('fail', () =>
    rxjs.lastValueFrom(
      spawnChild(() => spawn('bad-cmd'))
    ).then(
      () => assert(false, '!throw'),
      err => expect(err.code, 'ENOENT')
    )
  )

  test('success', () =>
    rxjs.lastValueFrom(
      spawnChild(() => spawn('echo Hello, world && echo Bye, world >&2 && exit 42', { shell: true })).pipe(
        rxjs.exhaustMap(child =>
          rxjs.forkJoin({
            stdout: (child.stdout$ as rxjs.Observable<string>).pipe(
              rxjs.takeUntil(child.close$),
              rxjs.reduce((acc, chunk) => acc.concat(chunk), '')
            ),
            stderr: (child.stderr$ as rxjs.Observable<string>).pipe(
              rxjs.takeUntil(child.close$),
              rxjs.reduce((acc, chunk) => acc.concat(chunk), '')
            ),
            exitCode: child.close$
          })
        )
      )
    ).then(
      ({ stdout, stderr, exitCode }) => {
        expect(stdout, 'Hello, world\n')
        expect(stderr, 'Bye, world\n')
        expect(exitCode, 42)
      }
    )
  )
})
