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
const semaphore_1 = require("./semaphore");
const assert = require("assert");
exports.default = {
    semaphore1() {
        return __awaiter(this, void 0, void 0, function* () {
            const sema = (0, semaphore_1.makeSemaphore)(1);
            const output = [];
            yield Promise.all([
                sema.runTask(() => __awaiter(this, void 0, void 0, function* () {
                    output.push(1);
                    yield new Promise(f => setTimeout(f, 100));
                    output.push(2);
                })),
                sema.runTask(() => __awaiter(this, void 0, void 0, function* () {
                    output.push(3);
                    yield new Promise(f => setTimeout(f, 50));
                    output.push(4);
                }))
            ]);
            assert(output.length == 4 &&
                output[0] == 1 &&
                output[1] == 2 &&
                output[2] == 3 &&
                output[3] == 4);
        });
    },
    semaphore2() {
        return __awaiter(this, void 0, void 0, function* () {
            const sema = (0, semaphore_1.makeSemaphore)(2);
            const output = [];
            yield Promise.all([
                sema.runTask(() => __awaiter(this, void 0, void 0, function* () {
                    output.push(1);
                    yield new Promise(f => setTimeout(f, 100));
                    output.push(2);
                })),
                sema.runTask(() => __awaiter(this, void 0, void 0, function* () {
                    output.push(3);
                    yield new Promise(f => setTimeout(f, 50));
                    output.push(4);
                }))
            ]);
            assert(output.length == 4 &&
                output[0] == 1 &&
                output[1] == 3 &&
                output[2] == 4 &&
                output[3] == 2);
        });
    },
    semaphore3() {
        return __awaiter(this, void 0, void 0, function* () {
            const sema = (0, semaphore_1.makeSemaphore)(1);
            const output = [];
            yield Promise.all([
                sema.runTask(() => __awaiter(this, void 0, void 0, function* () {
                    output.push(1);
                    yield new Promise(f => setTimeout(f, 100));
                    output.push(2);
                }), () => {
                    throw new Error("Canceled");
                }).then(() => assert(false), err => assert(err.message == "Canceled")),
                sema.runTask(() => __awaiter(this, void 0, void 0, function* () {
                    output.push(3);
                    yield new Promise(f => setTimeout(f, 50));
                    output.push(4);
                }))
            ]);
            assert(output.length == 2 &&
                output[0] == 3 &&
                output[1] == 4);
        });
    },
};
