"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spawnChild = void 0;
const child_process_1 = require("child_process");
const rxjs = require("rxjs");
function spawnChild(command, args, options) {
    return rxjs.defer(() => {
        const childProc = (0, child_process_1.spawn)(command, args, options);
        return rxjs.race(rxjs.fromEvent(childProc, 'error', (err) => err).pipe(rxjs.map(err => { throw err; })), rxjs.fromEvent(childProc, 'spawn').pipe(rxjs.take(1), rxjs.map(() => makeChild(childProc))));
    });
}
exports.spawnChild = spawnChild;
function makeChild(childProc) {
    return {
        pid: childProc.pid,
        stdout$: rxjs.fromEvent(childProc.stdout, 'data', (data) => data),
        stderr$: rxjs.fromEvent(childProc.stderr, 'data', (data) => data),
        error$: rxjs.fromEvent(childProc, 'error', (err) => err),
        close$: rxjs.fromEvent(childProc, 'close', (code, signal) => signal || code),
        stdin: childProc.stdin,
        kill: childProc.kill.bind(childProc)
    };
}
