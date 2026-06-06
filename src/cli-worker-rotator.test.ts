import { describe } from "@service-broker/test-utils"
import assert from "assert"
import type { ChildProcessByStdio } from "child_process"
import { EventEmitter } from "events"
import * as rxjs from "rxjs"
import { PassThrough, Readable, Writable } from "stream"
import { CLIRequest, CLIWorkerRotatorEvent, makeCLIWorkerRotator } from "./cli-worker-rotator.js"

type TestCLIWorker = ChildProcessByStdio<Writable, Readable, null> & {
  spawn(): void
  stdinEnded: boolean
}

describe('cli-worker-rotator', ({ test }) => {

  test('pairs stdout lines with requests in order', async () => {
    const request$ = new rxjs.Subject<CLIRequest>
    const child = makeEchoChild({ autoSpawn: true })
    const firstOutput$ = new rxjs.Subject<string>
    const secondOutput$ = new rxjs.Subject<string>

    const subscription = makeCLIWorkerRotator({
      spawnWorkerProcess: () => child,
      workerTtlMs: 1000,
      request$
    }).subscribe()

    try {
      request$.next({ input: 'one', output$: firstOutput$ })
      request$.next({ input: 'two', output$: secondOutput$ })

      const outputs = await Promise.all([
        rxjs.firstValueFrom(firstOutput$),
        rxjs.firstValueFrom(secondOutput$)
      ])

      assert.deepStrictEqual(outputs, ['ONE', 'TWO'])
    } finally {
      subscription.unsubscribe()
    }
  })

  test('buffers requests before the first worker is ready', async () => {
    const request$ = new rxjs.Subject<CLIRequest>
    const child = makeEchoChild()
    const firstOutput$ = new rxjs.Subject<string>
    const secondOutput$ = new rxjs.Subject<string>

    const subscription = makeCLIWorkerRotator({
      spawnWorkerProcess: () => child,
      workerTtlMs: 1000,
      request$
    }).subscribe()

    try {
      request$.next({ input: 'one', output$: firstOutput$ })
      request$.next({ input: 'two', output$: secondOutput$ })
      child.spawn()

      const outputs = await Promise.all([
        rxjs.firstValueFrom(firstOutput$),
        rxjs.firstValueFrom(secondOutput$)
      ])

      assert.deepStrictEqual(outputs, ['ONE', 'TWO'])
    } finally {
      subscription.unsubscribe()
    }
  })

  test('buffers requests between workers', async () => {
    const request$ = new rxjs.Subject<CLIRequest>
    const firstChild = makeEchoChild({ autoSpawn: true })
    const secondChild = makeEchoChild()
    const children = [firstChild, secondChild]
    const firstOutput$ = new rxjs.Subject<string>
    const secondOutput$ = new rxjs.Subject<string>

    const subscription = makeCLIWorkerRotator({
      spawnWorkerProcess: () => children.shift()!,
      workerTtlMs: 1000,
      request$
    }).subscribe()

    try {
      request$.next({ input: 'one', output$: firstOutput$ })
      assert.equal(await rxjs.firstValueFrom(firstOutput$), 'ONE')

      firstChild.emit('close', 0, null)
      request$.next({ input: 'two', output$: secondOutput$ })
      secondChild.spawn()

      assert.equal(await rxjs.firstValueFrom(secondOutput$), 'TWO')
      assert(firstChild.stdinEnded)
    } finally {
      subscription.unsubscribe()
    }
  })

  test('errors when pending request cap is exceeded', async () => {
    const request$ = new rxjs.Subject<CLIRequest>
    const child = makeEchoChild()
    const error = defer<unknown>()

    makeCLIWorkerRotator({
      spawnWorkerProcess: () => child,
      workerTtlMs: 1000,
      request$,
      maxPendingRequests: 1
    }).subscribe({
      error: err => error.resolve(err)
    })

    request$.next({ input: 'one', output$: new rxjs.Subject<string> })
    request$.next({ input: 'two', output$: new rxjs.Subject<string> })

    const err = await error.promise
    assert(err instanceof Error)
    assert.equal(err.message, 'Worker rotator exceeded max pending requests (1)')
  })

  test('reports lifecycle events', async () => {
    const request$ = new rxjs.Subject<CLIRequest>
    const child = makeEchoChild({ autoSpawn: true })
    const events: CLIWorkerRotatorEvent[] = []

    const subscription = makeCLIWorkerRotator({
      spawnWorkerProcess: () => child,
      workerTtlMs: 1000,
      request$,
      onEvent: event => events.push(event)
    }).subscribe()

    try {
      await waitFor(() => events.length >= 1)
      child.emit('close', 0, null)
      await waitFor(() => events.length >= 3)

      assert.deepStrictEqual(events.slice(0, 3).map(event => event.type), ['hired', 'quit', 'relieved'])
      assert.equal(events[1].type == 'quit' && events[1].reason, 'Worker exit 0')
    } finally {
      subscription.unsubscribe()
    }
  })
})

function makeEchoChild({ autoSpawn = false } = {}): TestCLIWorker {
  const child = new EventEmitter() as TestCLIWorker
  const stdout = new PassThrough()
  let remainder = ''
  let stdinEnded = false

  child.stdin = new Writable({
    write(chunk, _encoding, callback) {
      remainder += chunk.toString()
      const lines = remainder.split(/\r?\n/)
      remainder = lines.pop()!
      for (const line of lines) {
        stdout.write(line.toUpperCase() + '\n')
      }
      callback()
    },
    final(callback) {
      stdinEnded = true
      callback()
    }
  })
  child.stdout = stdout
  child.stderr = null
  child.spawn = () => child.emit('spawn')
  Object.defineProperty(child, 'stdinEnded', {
    get: () => stdinEnded
  })

  if (autoSpawn) {
    setTimeout(() => child.spawn(), 0)
  }

  return child
}

function defer<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

async function waitFor(condition: () => boolean) {
  for (let i = 0; i < 100; i++) {
    if (condition()) return
    await new Promise(resolve => setTimeout(resolve, 1))
  }
  assert(condition())
}
