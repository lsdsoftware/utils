export declare function makeRateLimiter({ interval, tokensPerInterval }: {
    interval: number;
    tokensPerInterval: number;
}): {
    getTokensRemaining(key: unknown): number;
    tryRemoveTokens(key: unknown, numTokens: number): boolean;
};
