import { makeLineSplitStream } from "./line-split-stream"
import * as assert from "assert"


export default {
  async lineSplitStream1() {
    const splitter = makeLineSplitStream()
    splitter.write('This is a line\nThis is another line\nAnd this is a line as well')
    splitter.end()

    const lines = await new Promise<string[]>(fulfill => {
      let accum: string[] = []
      splitter.on('data', line => accum.push(line))
      splitter.on('end', () => fulfill(accum))
    })
    assert(
      lines[0] == "This is a line\n" &&
      lines[1] == "This is another line\n" &&
      lines[2] == "And this is a line as well\n"
    )
  },

  async lineSplitStream2() {
    const splitter = makeLineSplitStream()
    splitter.write('\nThis is a line\n')
    splitter.end()

    const lines = await new Promise<string[]>(fulfill => {
      let accum: string[] = []
      splitter.on('data', line => accum.push(line))
      splitter.on('end', () => fulfill(accum))
    })
    assert(
      lines[0] == "\n" &&
      lines[1] == "This is a line\n"
    )
  },

  async lineSplitStream3() {
    const splitter = makeLineSplitStream()
    splitter.write('\n\n')
    splitter.end()

    const lines = await new Promise<string[]>(fulfill => {
      let accum: string[] = []
      splitter.on('data', line => accum.push(line))
      splitter.on('end', () => fulfill(accum))
    })
    assert(
      lines[0] == "\n" &&
      lines[1] == "\n"
    )
  },
}
