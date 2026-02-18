import { describe } from "@service-broker/test-utils"
import assert from "assert"
import { makeLineReader } from "./line-reader.js"

describe('line-reader', ({ test }) => {

  test('one', () => {
    const lines: string[] = []
    const splitter = makeLineReader(line => lines.push(line))
    splitter.write('This is a line\nThis is another line\r\nAnd this is a line as well')
    splitter.end()

    assert(
      lines[0] == "This is a line" &&
      lines[1] == "This is another line" &&
      lines[2] == "And this is a line as well"
    )
  })

  test('two', () => {
    const lines: string[] = []
    const splitter = makeLineReader(line => lines.push(line))
    splitter.write('\nThis is a line\n')
    splitter.end()

    assert(
      lines[0] == "" &&
      lines[1] == "This is a line"
    )
  })

  test('three', () => {
    const lines: string[] = []
    const splitter = makeLineReader(line => lines.push(line))
    splitter.write('\n\n')
    splitter.end()

    assert(
      lines[0] == "" &&
      lines[1] == ""
    )
  })
})
