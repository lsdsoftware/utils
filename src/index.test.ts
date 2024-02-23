import lineSplitStreamTests from "./line-reader.test"
import rateLimiterTests from "./rate-limiter.test"
import stateMachineTests from "./state-machine.test"

run({
    ...lineSplitStreamTests,
    ...rateLimiterTests,
    ...stateMachineTests,
  })
  .catch(console.error)


async function run(tests: Record<string, Function>) {
  for (const name in tests) {
    console.log("Running test", name)
    await tests[name]()
  }
}
