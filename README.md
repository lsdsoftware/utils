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


### Abortable
If you have an async operation, e.g.:

```typescript
async function myTask() {
  await step1()
  await step2()
  await step3()
}
```

And you need to make it abortable:
```typescript
import { makeAbortable } from "@lsdsoftware/utils"

const [abort, abortPromise, checkpoint] = makeAbortable()

//modify task to support early termination
async function myTask() {
  await step1
  checkpoint()  //will throw if aborted
  await step2
  checkpoint()
  await step3
}

//call abort() when you need to
setTimeout(() => abort(new Error("Timeout")), 5000)

//use Promise.race to run your task
const result = await Promise.race([
  abortPromise,
  myTask()
])
```
