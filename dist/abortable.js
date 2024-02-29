"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeAbortable = void 0;
function makeAbortable() {
    let isAborted;
    let reject;
    const promise = new Promise((f, r) => reject = r);
    function abort(reason) {
        isAborted = { reason };
        reject(reason);
    }
    function checkpoint() {
        if (isAborted)
            throw isAborted.reason;
    }
    return [
        abort,
        promise,
        checkpoint
    ];
}
exports.makeAbortable = makeAbortable;
