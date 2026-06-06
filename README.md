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
Observable wrapper for net.connect (see connect-socket.test.ts for usage)


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
