
class Bucket {
  constructor(public count: number, private expire: number) {
  }
  isValid() {
    return this.expire > Date.now()
  }
}


export function makeRateLimiter({interval, tokensPerInterval}: {interval: number, tokensPerInterval: number}) {
  const buckets = new Map<unknown, Bucket>()
  let lastCleanup = Date.now()

  return {
    getTokensRemaining(key: unknown): number {
      const bucket = buckets.get(key)
      return bucket?.isValid() ? bucket.count : tokensPerInterval
    },

    tryRemoveTokens(key: unknown, numTokens: number): boolean {
      if (Date.now()-lastCleanup > 2*interval) {
        lastCleanup = Date.now()
        for (const [key, bucket] of buckets) if (!bucket.isValid()) buckets.delete(key)
      }

      let bucket = buckets.get(key)
      if (!bucket?.isValid()) {
        bucket = new Bucket(tokensPerInterval, Date.now()+interval)
        buckets.set(key, bucket)
      }

      if (numTokens <= bucket.count) {
        bucket.count -= numTokens
        return true
      }
      else {
        return false
      }
    }
  }
}
