"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRateLimiter = void 0;
class Bucket {
    constructor(count, expire) {
        this.count = count;
        this.expire = expire;
    }
    isValid() {
        return this.expire > Date.now();
    }
}
function makeRateLimiter({ interval, tokensPerInterval }) {
    const buckets = new Map();
    let lastCleanup = Date.now();
    return {
        getTokensRemaining(key) {
            const bucket = buckets.get(key);
            return (bucket === null || bucket === void 0 ? void 0 : bucket.isValid()) ? bucket.count : tokensPerInterval;
        },
        tryRemoveTokens(key, numTokens) {
            if (Date.now() - lastCleanup > 2 * interval) {
                lastCleanup = Date.now();
                for (const [key, bucket] of buckets)
                    if (!bucket.isValid())
                        buckets.delete(key);
            }
            let bucket = buckets.get(key);
            if (!(bucket === null || bucket === void 0 ? void 0 : bucket.isValid())) {
                bucket = new Bucket(tokensPerInterval, Date.now() + interval);
                buckets.set(key, bucket);
            }
            if (numTokens <= bucket.count) {
                bucket.count -= numTokens;
                return true;
            }
            else {
                return false;
            }
        }
    };
}
exports.makeRateLimiter = makeRateLimiter;
