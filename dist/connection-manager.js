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
exports.makeConnectionManager = void 0;
function makeConnectionManager({ connect, retryDelay }) {
    let connectionPromise;
    let shutdownFlag = false;
    return {
        get() {
            if (!connectionPromise)
                connectionPromise = start();
            return connectionPromise;
        },
        shutdown() {
            shutdownFlag = true;
            connectionPromise === null || connectionPromise === void 0 ? void 0 : connectionPromise.then(con => con.close()).catch(err => "OK");
        }
    };
    function start() {
        return new Promise(fulfill => {
            let firstTime = true;
            keepAlive(promise => {
                if (firstTime) {
                    fulfill(promise);
                    firstTime = false;
                }
                else {
                    connectionPromise = promise;
                }
            });
        });
    }
    function keepAlive(onUpdate) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                while (true) {
                    const promise = connectUntilSucceed();
                    onUpdate(promise);
                    const connection = yield promise;
                    yield new Promise(f => connection.once("close", f));
                }
            }
            catch (err) {
            }
        });
    }
    function connectUntilSucceed() {
        return __awaiter(this, void 0, void 0, function* () {
            while (true) {
                if (shutdownFlag)
                    throw new Error("Shutting down");
                try {
                    return yield connect();
                }
                catch (err) {
                    yield new Promise(f => setTimeout(f, retryDelay));
                }
            }
        });
    }
}
exports.makeConnectionManager = makeConnectionManager;
