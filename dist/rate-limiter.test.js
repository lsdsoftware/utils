"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const rate_limiter_1 = require("./rate-limiter");
const assert = require("assert");
exports.default = {
    rateLimiter1() {
        return __awaiter(this, void 0, void 0, function* () {
            const limiter = (0, rate_limiter_1.makeRateLimiter)({ tokensPerInterval: 5, interval: 2000 });
            assert(limiter.getTokensRemaining("k1") == 5);
            assert(limiter.tryRemoveTokens("k1", 3) == true);
            assert(limiter.getTokensRemaining("k1") == 2);
            assert(limiter.tryRemoveTokens("k1", 4) == false);
            assert(limiter.tryRemoveTokens("k2", 4) == true);
            yield new Promise(f => setTimeout(f, 1500));
            assert(limiter.tryRemoveTokens("k1", 4) == false);
            assert(limiter.getTokensRemaining("k1") == 2);
            yield new Promise(f => setTimeout(f, 1000));
            assert(limiter.tryRemoveTokens("k1", 4) == true);
            //new bucket, won't expire until 2 seconds from now
            assert(limiter.getTokensRemaining("k1") == 1);
            assert(limiter.tryRemoveTokens("k1", 2) == false);
            yield new Promise(f => setTimeout(f, 1900));
            assert(limiter.tryRemoveTokens("k1", 2) == false);
            assert(limiter.getTokensRemaining("k1") == 1);
            yield new Promise(f => setTimeout(f, 200));
            assert(limiter.tryRemoveTokens("k1", 2) == true);
            assert(limiter.getTokensRemaining("k1") == 3);
        });
    }
};
