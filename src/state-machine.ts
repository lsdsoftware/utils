
type EventHandler<StateName> = (...args: any) => StateName|void

export type State<StateName extends string, EventName extends string> = Partial<Record<EventName|"onTransitionIn", EventHandler<StateName>>>

export function makeStateMachine<StateName extends string, EventName extends string>(states: Record<StateName|"IDLE", State<StateName, EventName>>) {
  let currentStateName: StateName|"IDLE" = "IDLE"
  states[currentStateName].onTransitionIn?.()
  let lock = 0
  return {
    trigger(eventName: EventName, ...args: any) {
      if (lock) throw new Error("Cannot trigger an event synchronously while inside an event handler")
      lock++;
      try {
        const currentState = states[currentStateName]
        if (!(eventName in currentState)) throw new Error("Missing handler " + currentStateName + "." + eventName)
        const nextStateName = currentState[eventName]!(...args)
        if (nextStateName) {
          if (!(nextStateName in states)) throw new Error("Missing state " + nextStateName)
          currentStateName = nextStateName
          states[currentStateName].onTransitionIn?.()
        }
      }
      finally {
        lock--;
      }
    },
    getState() {
      return currentStateName;
    }
  }
}
