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


### Worker Rotator
Rotate worker instances over a request stream and emit worker lifecycle events.

```typescript
import { makeWorkerRotator } from "@lsdsoftware/utils"

const events$ = makeWorkerRotator({
  makeWorker,
  workerTtlMs: 60_000,
  request$,
  maxPendingRequests: 100
})
```

Contract:

- The returned observable is cold. Each subscription creates its own rotator engine and subscribes to `request$`; share the returned observable if you want one engine with multiple observers.
- Requests emitted before the first worker is ready, or between workers, are buffered and handed to the next worker.
- `maxPendingRequests` caps the no-worker buffer and errors the rotator when exceeded. The default is `Infinity`.
- Pending requests are considered handed off once they are passed to `worker.process`. Delivery retries, acknowledgements, and exactly-once guarantees belong in the worker or an upstream queue.
- Completing `request$` means no more input, but it does not define the rotator lifecycle. The engine runs until the returned observable is unsubscribed or errors.
- `worker.relieve()` is called during worker teardown. Implementations should make it safe to call more than once.


### CLI Worker Rotator
Rotate child processes that communicate over stdin/stdout using a line-oriented request/response protocol, such as JSONL.

```typescript
import { spawn } from "node:child_process"
import { makeCLIWorkerRotator } from "@lsdsoftware/utils"

const events$ = makeCLIWorkerRotator({
  spawnWorkerProcess: () => spawn("my-jsonl-worker", {
    stdio: ["pipe", "pipe", "inherit"]
  }),
  workerTtlMs: 60_000,
  request$,
  maxPendingRequests: 100
})
```

Each request writes exactly one stdin line. Each stdout line is paired with the next pending request in order. Child processes should write logs to stderr.

For custom framing or multiplexed protocols, implement `Worker<R>` directly and use `makeWorkerRotator`.

If a worker exits before producing a matching stdout line for a written request, that request's `output$` is not resolved by this adapter. Apply timeout or cancellation around each request if the caller needs bounded waits.
