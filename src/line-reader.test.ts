import { makeLineReader } from "./line-reader"
import * as assert from "assert"


export default {
  async lineReader1() {
    const lines: string[] = []
    const splitter = makeLineReader(line => lines.push(line))
    splitter.write('This is a line\nThis is another line\r\nAnd this is a line as well')
    splitter.end()

    assert(
      lines[0] == "This is a line" &&
      lines[1] == "This is another line" &&
      lines[2] == "And this is a line as well"
    )
  },

  async lineReader2() {
    const lines: string[] = []
    const splitter = makeLineReader(line => lines.push(line))
    splitter.write('\nThis is a line\n')
    splitter.end()

    assert(
      lines[0] == "" &&
      lines[1] == "This is a line"
    )
  },

  async lineReader3() {
    const lines: string[] = []
    const splitter = makeLineReader(line => lines.push(line))
    splitter.write('\n\n')
    splitter.end()

    assert(
      lines[0] == "" &&
      lines[1] == ""
    )
  },
}
