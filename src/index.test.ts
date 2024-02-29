import lineReaderTests from "./line-reader.test"
import semaphoreTest from "./semaphore.test"
import abortableTest from "./abortable.test"

run({
    ...lineReaderTests,
    ...semaphoreTest,
    ...abortableTest,
  })
  .catch(console.error)


async function run(tests: Record<string, Function>) {
  for (const name in tests) {
    console.log("Running test", name)
    await tests[name]()
  }
}
