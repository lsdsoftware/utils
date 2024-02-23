import { makeRateLimiter } from "./rate-limiter"
import * as assert from "assert"


export default {
  async rateLimiter1() {
    const limiter = makeRateLimiter({tokensPerInterval: 5, interval: 2000})

    assert(limiter.getTokensRemaining("k1") == 5)
    assert(limiter.tryRemoveTokens("k1", 3) == true)
    assert(limiter.getTokensRemaining("k1") == 2)
    assert(limiter.tryRemoveTokens("k1", 4) == false)
    assert(limiter.tryRemoveTokens("k2", 4) == true)

    await new Promise(f => setTimeout(f, 1500))
    assert(limiter.tryRemoveTokens("k1", 4) == false)
    assert(limiter.getTokensRemaining("k1") == 2)

    await new Promise(f => setTimeout(f, 1000))
    assert(limiter.tryRemoveTokens("k1", 4) == true)
    //new bucket, won't expire until 2 seconds from now
    assert(limiter.getTokensRemaining("k1") == 1)
    assert(limiter.tryRemoveTokens("k1", 2) == false)

    await new Promise(f => setTimeout(f, 1900))
    assert(limiter.tryRemoveTokens("k1", 2) == false)
    assert(limiter.getTokensRemaining("k1") == 1)

    await new Promise(f => setTimeout(f, 200))
    assert(limiter.tryRemoveTokens("k1", 2) == true)
    assert(limiter.getTokensRemaining("k1") == 3)
  }
}
