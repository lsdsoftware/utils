import { createConnection } from "net";
import * as rxjs from "rxjs";
export function connectSocket(options) {
    return rxjs.defer(() => {
        const sock = createConnection(options);
        if (options.encoding)
            sock.setEncoding(options.encoding);
        return rxjs.race(rxjs.fromEvent(sock, 'error').pipe(rxjs.map(err => { throw err; })), rxjs.fromEvent(sock, 'connect').pipe(rxjs.take(1), rxjs.map(() => makeConnection(sock))));
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
