import { makeStateMachine } from "./state-machine"
import * as assert from "assert"


export default {
  async stateMachine1() {
    const sm = makeStateMachine({
      IDLE: {
        play() {
          return "PLAYING"
        },
        stop() {},
        goto(state: "STUCK") {
          return state
        }
      },
      PLAYING: {
        play() {},
        stop() {
          return "STOPPING"
        }
      },
      STOPPING: {
        onTransitionIn(this: any) {
          this.timer = setTimeout(() => sm.trigger("onStop"), 2000)
        },
        onStop() {
          return "IDLE"
        },
        play(this: any) {
          clearTimeout(this.timer)
          return "PLAYING"
        },
        stop() {}
      },
      STUCK: {
      }
    })

    assert(sm.getState() == "IDLE")
    sm.trigger("play")
    assert(sm.getState() == "PLAYING")
    sm.trigger("stop")
    assert(sm.getState() == "STOPPING")
    await sleep(1000)
    sm.trigger("play")
    assert(sm.getState() == "PLAYING")
    await sleep(3000)
    assert(sm.getState() == "PLAYING")
    sm.trigger("stop")
    assert(sm.getState() == "STOPPING")
    await sleep(3000)
    assert(sm.getState() == "IDLE")
    sm.trigger("goto", "STUCK")
    assert(sm.getState() == "STUCK")
  },
}


function sleep(ms: number) {
  return new Promise(f => setTimeout(f, ms))
}
