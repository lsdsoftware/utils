import { makeAbortable } from "./abortable"
import * as assert from "assert"

async function task(checkpoint: () => void, output: number[]) {
  output.push(1)
  await new Promise(f => setTimeout(f, 100))
  checkpoint()
  output.push(2)
  await new Promise(f => setTimeout(f, 100))
  checkpoint()
  output.push(3)
  await new Promise(f => setTimeout(f, 100))
}

export default {
  async abortable1() {
    const [abort, abortPromise, checkpoint] = makeAbortable()
    const timer = setTimeout(() => abort("Canceled"), 10000)
    const output = [] as number[]
    await Promise.race([
      abortPromise,
      task(checkpoint, output)
        .finally(() => clearTimeout(timer))
    ])
    assert(
      output.length == 3 &&
      output[0] == 1 &&
      output[1] == 2 &&
      output[2] == 3
    )
  },

  async abortable2() {
    const [abort, abortPromise, checkpoint] = makeAbortable()
    setTimeout(() => abort("Canceled"), 150)
    const output = [] as number[]
    await Promise.race([
      abortPromise.catch(err => Promise.reject(err + " by promise")),
      task(checkpoint, output)
    ]).then(
      () => assert(false),
      err => assert(err == "Canceled by promise")
    )
    assert(
      output.length == 2 &&
      output[0] == 1 &&
      output[1] == 2
    )
  },

  async abortable3() {
    const [abort, abortPromise, checkpoint] = makeAbortable()
    setTimeout(() => abort("Canceled"), 150)
    const output = [] as number[]
    await Promise.race([
      abortPromise.catch(err => new Promise(f => "Never")),
      task(checkpoint, output)
    ]).then(
      () => assert(false),
      err => assert(err == "Canceled")
    )
    assert(
      output.length == 2 &&
      output[0] == 1 &&
      output[1] == 2
    )
  },
}
