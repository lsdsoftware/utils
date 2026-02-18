
export function makeSemaphore(count: number) {
  const waiters: (() => void)[] = []
  return {
    async runTask<T>(task: () => Promise<T>, onStart?: () => void): Promise<T> {
      if (count > 0) count--
      else await new Promise<void>(f => waiters.push(f))
      try {
        onStart?.()
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
