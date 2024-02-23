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
exports.makeSemaphore = void 0;
function makeSemaphore(count) {
    const waiters = [];
    return {
        runTask(task) {
            return __awaiter(this, void 0, void 0, function* () {
                if (count > 0)
                    count--;
                else
                    yield new Promise(f => waiters.push(f));
                try {
                    return yield task();
                }
                finally {
                    count++;
                    while (count > 0 && waiters.length > 0) {
                        count--;
                        waiters.shift()();
                    }
                }
            });
        }
    };
}
exports.makeSemaphore = makeSemaphore;
