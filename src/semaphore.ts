
export function makeSemaphore(count: number) {
  const waiters: Function[] = []
  return {
    async runTask<T>(task: () => Promise<T>, checkpoint?: () => void): Promise<T> {
      if (count > 0) count--
      else await new Promise(f => waiters.push(f))
      checkpoint?.()
      try {
        return await task()
      }
      finally {
        count++
        while (count > 0 && waiters.length > 0) {
          count--
          waiters.shift()!()
        }
      }
    }
  }
}
