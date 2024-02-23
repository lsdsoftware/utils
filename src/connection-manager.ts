
interface Closeable {
  close(): void
  once(event: "close", callback: Function): void
}

export interface ConnectionManager<Connection> {
  get(): Promise<Connection>
  shutdown(): void
}


export function makeConnectionManager<Connection extends Closeable>({connect, retryDelay}: {connect(): Promise<Connection>, retryDelay: number}): ConnectionManager<Connection> {

  let connectionPromise: Promise<Connection>|undefined
  let shutdownFlag = false
  return {
    get() {
      if (!connectionPromise) connectionPromise = start()
      return connectionPromise
    },
    shutdown() {
      shutdownFlag = true
      connectionPromise?.then(con => con.close()).catch(err => "OK")
    }
  }


  function start() {
    return new Promise<Connection>(fulfill => {
      let firstTime = true
      keepAlive(promise => {
        if (firstTime) {
          fulfill(promise)
          firstTime = false
        }
        else {
          connectionPromise = promise
        }
      })
    })
  }

  async function keepAlive(onUpdate: (promise: Promise<Connection>) => void): Promise<void> {
    try {
      while (true) {
        const promise = connectUntilSucceed()
        onUpdate(promise)
        const connection = await promise
        await new Promise(f => connection.once("close", f))
      }
    }
    catch(err) {
    }
  }

  async function connectUntilSucceed() {
    while (true) {
      if (shutdownFlag) throw new Error("Shutting down")
      try {
        return await connect()
      }
      catch(err) {
        await new Promise(f => setTimeout(f, retryDelay))
      }
    }
  }
}
