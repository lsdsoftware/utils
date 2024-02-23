# Useful JavaScript utilities


### State Machine
Make implementing state machines less error prone.

```typescript
import { makeStateMachine } from "@lsdsoftware/utils"

const sm = makeStateMachine({
  IDLE: {
    startIt() {
      //do something
      return "BUSY"
    }
  },
  BUSY: {
    stopIt() {
      //stop doing it
      return "IDLE"
    },
    stopAfterDelay() {
      return "STOPPING"
    }
  },
  STOPPING: {
    onTransitionIn(this: any) {
      //do some clean up
      this.timer = setTimeout(() => sm.trigger("onDone"), 3000)
    },
    onDone() {
      return "IDLE"
    },
    stopIt() {
      console.log("Already stopping, be patient!")
      //return void to stay in same state
    },
    forceIt(this: any) {
      clearTimeout(this.timer)
      return "IDLE"
    }
  }
})

sm.trigger("startIt")
sm.getState()   //BUSY
```



### Message Dispatcher
Dispatch messages to handlers.  This utility assumes messages are one of three types: request, response, or notification; and follow a predefined format (see type definition below).

Call `dispatch` to dispatch a message.  Requests and notifications are dispatched to request handlers that you provided at construction.  Responses are dispatched to response listeners, you listen for response by calling `waitForResponse`.

A _myAddress_ parameter provided at construction is used to filter messages.  Only requests and notifications whose _to_ attribute matches _myAddress_ will be processed.

```typescript
interface Request {
  to: string
  type: "request"
  id: "string"
  method: string
  args: Record<string, unknown>
}

interface Notification {
  to: string
  type: "notification"
  method: string
  args: Record<string, unknown>
}

interface Response {
  type: "response"
  id: string
  error: unknown
  result: unknown
}
```

```typescript
import { makeMessageDispatcher } from "@lsdsoftware/utils"

const requestHandlers = {
  method1({paramA, paramB}, sender) {
    //do something
    return result
  },
  async method2({x, y, z}, sender) {
    //do something
    return result
  }
}

const dispatcher = makeMessageDispatcher("myAddress", requestHandlers)

//sample usage

//processing requests and responses
window.addEventListener("message", event => {
  const sender = {window: event.source, origin: event.origin}
  const sendResponse = response => sender.window.postMessage(response, sender.origin)
  dispatcher.dispatch(event.data, sender, sendResponse)
})

//sending requests
const id = String(Math.random())
const request = {to: "someAddress", type: "request", id, method: "someMethod", args: {}}
iframeWindow.postMessage(request, "*")
dispatcher.waitForResponse(id)
  .then(result => console.log(result))
  .catch(console.error)
```



### Rate Limiter
Basic rate limiter using the token bucket algorithm.

```typescript
import { RateLimiter } from "@lsdsoftware/utils"

const limiter = new RateLimiter({tokensPerInterval: 5, interval: 60*1000})

function handleRequest(userId, req) {
  if (limiter.tryRemoveTokens(userId, 1)) return processRequest(req)
  else throw "Rate limit exceeded"
}
```



### Connection Manager
Takes a connect() method and:
- Only call it to create a connection when needed
- Automatically retry on failure
- Automatically reconnect if the previous connection was closed
- Properly handle shutdown sequence

```typescript
import { makeConnectionManager } from "@lsdsoftware/utils"

const conMgr = new ConnectionManager({
  async connect() {
    //...
    return connection
  },
  retryDelay: 10*1000
})

//wherever you need the connection
const connection = await conMgr.get()

//shutdown
conMgr.shutdown()
```



### Line Split Stream
A Transform stream that transforms a byte stream into lines of text (by GPT-4)

```typescript
import { makeLineSplitStream } from "@lsdsoftware/utils"

const splitter = makeLineSplitStream()
splitter.on('data', line => console.log('Received line:', line))

// Simulating input
splitter.write('This is a line\nThis is another line\nAnd this is a line as well')
splitter.end() // End the stream to see the _flush effect.
```
