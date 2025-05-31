import lineReaderTests from "./line-reader.test"
import semaphoreTest from "./semaphore.test"

run({
    ...lineReaderTests,
    ...semaphoreTest,
  })
  .catch(console.error)


async function run(tests: Record<string, Function>) {
  for (const name in tests) {
    console.log("Running test", name)
    await tests[name]()
  }
}
