import { describe, expect } from "@service-broker/test-utils";
import assert from "assert";
import * as rxjs from "rxjs";
import { connectSocket } from './connect-socket.js';
describe('connect-socket', ({ test }) => {
    test('fail', () => rxjs.lastValueFrom(connectSocket({ port: -1 })).then(() => assert(false, '!throw'), err => expect(err.code, 'ERR_SOCKET_BAD_PORT')));
    test('success', () => rxjs.lastValueFrom(connectSocket({ host: 'lsdsoftware.com', port: 80, encoding: 'utf8', timeout: 100 }).pipe(rxjs.exhaustMap(conn => rxjs.forkJoin({
        request: rxjs.timer(120).pipe(rxjs.tap(() => {
            conn.socket.write('GET / HTTP/1.1\nHost: lsdsoftware.com\n\n');
            conn.socket.end();
        })),
        response: conn.data$.pipe(rxjs.takeUntil(conn.close$), rxjs.reduce((acc, chunk) => {
            assert(typeof chunk == 'string');
            return acc.concat(chunk);
        }, '')),
        errors: conn.error$.pipe(rxjs.takeUntil(conn.close$), rxjs.reduce((acc, err) => acc.concat(err), [])),
        timeouts: conn.timeout$.pipe(rxjs.takeUntil(conn.close$), rxjs.reduce(acc => acc + 1, 0)),
        closedWithError: conn.close$
    })))).then(({ response, errors, timeouts, closedWithError }) => {
        assert(response.startsWith('HTTP/1.1 301'));
        expect(errors, []);
        expect(timeouts, 1);
        expect(closedWithError, false);
    }));
});
