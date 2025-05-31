"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectSocket = void 0;
const net_1 = require("net");
const rxjs = require("rxjs");
function connectSocket(options) {
    return rxjs.defer(() => {
        const sock = (0, net_1.createConnection)(options);
        if (options.timeout)
            sock.setTimeout(options.timeout);
        if (options.encoding)
            sock.setEncoding(options.encoding);
        return rxjs.race(rxjs.fromEvent(sock, 'error').pipe(rxjs.map(err => { throw err; })), rxjs.fromEvent(sock, 'connect').pipe(rxjs.take(1), rxjs.map(() => makeConnection(sock))));
    });
}
exports.connectSocket = connectSocket;
function makeConnection(sock) {
    return {
        data$: rxjs.fromEvent(sock, 'data', (data) => data).pipe(rxjs.takeUntil(rxjs.fromEvent(sock, 'end'))),
        error$: rxjs.fromEvent(sock, 'error', (err) => err),
        close$: rxjs.merge(rxjs.fromEvent(sock, 'close', (hadError) => hadError ? 'Normal close' : 'Close with error'), rxjs.fromEvent(sock, 'timeout', () => 'Socket timeout')),
        write: sock.write.bind(sock),
        end: sock.end.bind(sock)
    };
}
