import { makeSemaphore } from "./semaphore"
import * as assert from "assert"

export default {
  async semaphore1() {
    const sema = makeSemaphore(1)
    const output = [] as number[]
    await Promise.all([
      sema.runTask(async () => {
        output.push(1)
        await new Promise(f => setTimeout(f, 100))
        output.push(2)
      }),
      sema.runTask(async () => {
        output.push(3)
        await new Promise(f => setTimeout(f, 50))
        output.push(4)
      })
    ])
    assert(
      output.length == 4 &&
      output[0] == 1 &&
      output[1] == 2 &&
      output[2] == 3 &&
      output[3] == 4
    )
  },

  async semaphore2() {
    const sema = makeSemaphore(2)
    const output = [] as number[]
    await Promise.all([
      sema.runTask(async () => {
        output.push(1)
        await new Promise(f => setTimeout(f, 100))
        output.push(2)
      }),
      sema.runTask(async () => {
        output.push(3)
        await new Promise(f => setTimeout(f, 50))
        output.push(4)
      })
    ])
    assert(
      output.length == 4 &&
      output[0] == 1 &&
      output[1] == 3 &&
      output[2] == 4 &&
      output[3] == 2
    )
  },

  async semaphore3() {
    const sema = makeSemaphore(1)
    const output = [] as number[]
    await Promise.all([
      sema.runTask(async () => {
        output.push(1)
        await new Promise(f => setTimeout(f, 100))
        output.push(2)
      }, () => {
        throw new Error("Canceled")
      }).then(
        () => assert(false),
        err => assert(err.message == "Canceled")
      ),
      sema.runTask(async () => {
        output.push(3)
        await new Promise(f => setTimeout(f, 50))
        output.push(4)
      })
    ])
    assert(
      output.length == 2 &&
      output[0] == 3 &&
      output[1] == 4
    )
  },
}
