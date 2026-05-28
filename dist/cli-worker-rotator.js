import * as rxjs from "rxjs";
import { makeLineReader } from "./line-reader.js";
import { makeWorkerRotator } from "./worker-rotator.js";
/**
 * Rotates child processes that communicate over stdin/stdout using a
 * line-oriented request/response protocol, such as JSONL.
 * See the README for the protocol and lifecycle contract.
 */
export function makeCLIWorkerRotator({ spawnWorkerProcess, workerTtlMs, request$, maxPendingRequests }) {
    return makeWorkerRotator({
        makeWorker: () => makeWorker(spawnWorkerProcess),
        workerTtlMs,
        request$,
        maxPendingRequests
    }).pipe(rxjs.map(event => ({ ...event, worker: event.worker.child })));
}
async function makeWorker(spawn) {
    const child = spawn();
    await new Promise((f, r) => child.once('spawn', f).once('error', r));
    return {
        child,
        process(request$) {
            return request$.pipe(rxjs.mergeMap(request => writeLn(child.stdin, request.input).pipe(rxjs.map(() => request), rxjs.catchError(err => {
                request.output$.error(err);
                return rxjs.EMPTY;
            }))), rxjs.zipWith(readLines(child.stdout)), rxjs.tap(([request, line]) => request.output$.next(line)), rxjs.ignoreElements());
        },
        relieve() {
            child.stdin.end();
        },
        quit$: rxjs.race(rxjs.fromEvent(child, 'close', (code, signal) => `Worker exit ${signal || code}`), rxjs.fromEvent(child.stdin, 'error', err => new Error('Worker stdin error', { cause: err })))
    };
}
function readLines(stream) {
    return new rxjs.Observable(subscriber => {
        const lineReader = makeLineReader(line => subscriber.next(line));
        const onError = (err) => subscriber.error(err);
        const onFinish = () => subscriber.complete();
        lineReader.once('error', onError);
        lineReader.once('finish', onFinish);
        stream.once('error', onError);
        stream.pipe(lineReader);
        return () => {
            lineReader.off('error', onError);
            lineReader.off('finish', onFinish);
            stream.off('error', onError);
            stream.unpipe(lineReader);
            lineReader.destroy();
        };
    });
}
function writeLn(stream, line) {
    return new rxjs.Observable(subscriber => {
        try {
            stream.write(line + "\n", err => {
                if (err) {
                    subscriber.error(err);
                }
                else {
                    subscriber.next();
                    subscriber.complete();
                }
            });
        }
        catch (err) {
            subscriber.error(err);
        }
    });
}
