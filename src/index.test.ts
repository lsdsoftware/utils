import lineSplitStreamTests from "./line-reader.test"

run({
    ...lineSplitStreamTests,
  })
  .catch(console.error)


async function run(tests: Record<string, Function>) {
  for (const name in tests) {
    console.log("Running test", name)
    await tests[name]()
  }
}
