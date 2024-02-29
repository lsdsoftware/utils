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
const abortable_1 = require("./abortable");
const assert = require("assert");
function task(checkpoint, output) {
    return __awaiter(this, void 0, void 0, function* () {
        output.push(1);
        yield new Promise(f => setTimeout(f, 100));
        checkpoint();
        output.push(2);
        yield new Promise(f => setTimeout(f, 100));
        checkpoint();
        output.push(3);
        yield new Promise(f => setTimeout(f, 100));
    });
}
exports.default = {
    abortable1() {
        return __awaiter(this, void 0, void 0, function* () {
            const [abort, abortPromise, checkpoint] = (0, abortable_1.makeAbortable)();
            const timer = setTimeout(() => abort("Canceled"), 10000);
            const output = [];
            yield Promise.race([
                abortPromise,
                task(checkpoint, output)
                    .finally(() => clearTimeout(timer))
            ]);
            assert(output.length == 3 &&
                output[0] == 1 &&
                output[1] == 2 &&
                output[2] == 3);
        });
    },
    abortable2() {
        return __awaiter(this, void 0, void 0, function* () {
            const [abort, abortPromise, checkpoint] = (0, abortable_1.makeAbortable)();
            setTimeout(() => abort("Canceled"), 150);
            const output = [];
            yield Promise.race([
                abortPromise.catch(err => Promise.reject(err + " by promise")),
                task(checkpoint, output)
            ]).then(() => assert(false), err => assert(err == "Canceled by promise"));
            assert(output.length == 2 &&
                output[0] == 1 &&
                output[1] == 2);
        });
    },
    abortable3() {
        return __awaiter(this, void 0, void 0, function* () {
            const [abort, abortPromise, checkpoint] = (0, abortable_1.makeAbortable)();
            setTimeout(() => abort("Canceled"), 150);
            const output = [];
            yield Promise.race([
                abortPromise.catch(err => new Promise(f => "Never")),
                task(checkpoint, output)
            ]).then(() => assert(false), err => assert(err == "Canceled"));
            assert(output.length == 2 &&
                output[0] == 1 &&
                output[1] == 2);
        });
    },
};
