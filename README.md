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


### Spawn Child
Observable wrapper for child_process.spawn (see spawn-child.test.ts for usage)
