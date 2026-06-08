import { createConnection } from "net";
import * as rxjs from "rxjs";
import { finalizeWithReason } from "./finalize-with-reason.js";
export function connectSocket(options) {
    return rxjs.defer(() => {
        const abortCtl = new AbortController();
        const sock = createConnection({ ...options, signal: abortCtl.signal });
        if (options.encoding)
            sock.setEncoding(options.encoding);
        return rxjs.race(rxjs.fromEvent(sock, 'error').pipe(rxjs.map(err => { throw err; })), rxjs.fromEvent(sock, 'connect').pipe(rxjs.take(1), rxjs.map(() => makeConnection(sock)))).pipe(finalizeWithReason(reason => {
            if (reason == 'unsubscribe')
                abortCtl.abort();
        }));
    });
}
function makeConnection(sock) {
    return {
        socket: sock,
        data$: rxjs.fromEvent(sock, 'data').pipe(rxjs.takeUntil(rxjs.fromEvent(sock, 'end'))),
        error$: rxjs.fromEvent(sock, 'error'),
        timeout$: rxjs.fromEvent(sock, 'timeout'),
        close$: rxjs.fromEvent(sock, 'close').pipe(rxjs.take(1)),
    };
}
