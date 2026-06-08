# Useful JavaScript utilities


### Line Reader
Split text into lines

```typescript
import { makeLineReader } from "@lsdsoftware/utils"

myStream.pipe(makeLineReader(line => console.log(line)))
```


### Semaphore
Control concurrent access to resources

```typescript
import { makeSemaphore } from "@lsdsoftware/utils"

const semaphore = makeSemaphore(3)

const result = await semaphore.runTask(async () => {
  //use the limited resource
})
```


### Connect Socket
Observable wrapper for `net.createConnection`.

```typescript
import { connectSocket } from "@lsdsoftware/utils"
import * as rxjs from "rxjs"

const abortCtl = new AbortController()

const connection = await rxjs.firstValueFrom(
  connectSocket({
    host: "example.com",
    port: 80,
    encoding: "utf8",
    signal: abortCtl.signal
  })
)

connection.socket.write("GET / HTTP/1.1\r\nHost: example.com\r\n\r\n")

connection.data$.pipe(
  rxjs.takeUntil(connection.close$)
).subscribe(chunk => {
  console.log(chunk)
})
```

`connectSocket(options)` is cold. Each subscription creates a new `net.Socket`, starts a connection, and emits one `Connection` when the socket connects. If the socket emits `error` before `connect`, the observable errors.

`options` are passed through to `net.createConnection(options)`, with one addition:

- `encoding` calls `socket.setEncoding(encoding)` before the connection result is emitted.

The returned `Connection` contains:

- `socket`: the underlying `net.Socket`; callers own protocol writes and graceful shutdown after connection.
- `data$`: socket `data` events, completed when the readable side emits `end`.
- `error$`: socket `error` events.
- `timeout$`: socket `timeout` events. Like `net.Socket`, timeout only notifies; callers must close the socket themselves.
- `close$`: one-shot socket `close` event, replayable to late subscribers through the same close promise.

Cancellation:

- Unsubscribing before the connection is established aborts the pending socket connection.
- Passing `signal` forwards caller cancellation into the pending socket connection, including an already-aborted signal and its abort reason.
- Caller abort forwarding stops once the socket closes, so long-lived caller signals do not retain closed sockets.
- After a `Connection` is emitted, callers own socket shutdown. Use the protocol's normal close command, `socket.end()`, or `socket.destroy()` as appropriate.


### CLI Worker Rotator
Rotate child processes that communicate over stdin/stdout using a line-oriented request/response protocol, such as JSONL.

```typescript
import { spawn } from "node:child_process"
import { makeCLIWorkerRotator } from "@lsdsoftware/utils"

const subscription = makeCLIWorkerRotator({
  spawnWorkerProcess: () => spawn("my-jsonl-worker", {
    stdio: ["pipe", "pipe", "inherit"]
  }),
  workerTtlMs: 60_000,
  request$,
  maxPendingRequests: 100,
  onEvent: event => console.debug('[cli-worker-rotator]', event)
}).subscribe()
```

Each request writes exactly one stdin line. Each stdout line is paired with the next pending request in order. Child processes should write logs to stderr.

Contract:

- The returned observable is cold and does not emit values. Each subscription creates its own rotator engine and subscribes to `request$`; share the returned observable if you want one engine with multiple observers.
- `onEvent` receives optional lifecycle events for logging, tracing, or diagnostics.
- Requests emitted before the first child process is ready, or between child processes, are buffered and handed to the next child process.
- `maxPendingRequests` caps the no-worker buffer and errors the rotator when exceeded. The default is `Infinity`.
- Pending requests are considered handed off once they are written to a worker process. Delivery retries, acknowledgements, and exactly-once guarantees belong in the worker or an upstream queue.
- Completing `request$` means no more input, but it does not define the rotator lifecycle. The engine runs until the returned observable is unsubscribed or errors.
- Worker stdin is ended during teardown. Child processes should exit cleanly when stdin closes.

If a worker exits before producing a matching stdout line for a written request, that request's `output$` is not resolved by this adapter. Apply timeout or cancellation around each request if the caller needs bounded waits.
