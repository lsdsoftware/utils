import { describe } from "@service-broker/test-utils";
import assert from "assert";
import * as rxjs from "rxjs";
import { makeWorkerRotator } from "./worker-rotator.js";
describe('worker-rotator', ({ test }) => {
    test('buffers requests before the first worker is ready', async () => {
        const request$ = new rxjs.Subject;
        const worker = makeTestWorker();
        const workerReady = defer();
        const processed = [];
        worker.processRequests$.subscribe(request => processed.push(request));
        const subscription = makeWorkerRotator({
            makeWorker: () => workerReady.promise,
            workerTtlMs: 1000,
            request$
        }).subscribe();
        try {
            request$.next(1);
            request$.next(2);
            workerReady.resolve(worker);
            await waitFor(() => processed.length == 2);
            assert.deepStrictEqual(processed, [1, 2]);
        }
        finally {
            subscription.unsubscribe();
        }
    });
    test('buffers requests between workers', async () => {
        const request$ = new rxjs.Subject;
        const firstWorker = makeTestWorker();
        const secondWorker = makeTestWorker();
        const firstWorkerReady = defer();
        const secondWorkerReady = defer();
        const workersReady = [firstWorkerReady, secondWorkerReady];
        const processed = [];
        firstWorker.processRequests$.subscribe(request => processed.push(request));
        secondWorker.processRequests$.subscribe(request => processed.push(request));
        const subscription = makeWorkerRotator({
            makeWorker: () => workersReady.shift().promise,
            workerTtlMs: 1000,
            request$
        }).subscribe();
        try {
            firstWorkerReady.resolve(firstWorker);
            await waitFor(() => firstWorker.processCalls == 1);
            request$.next(1);
            firstWorker.quit$.next('done');
            request$.next(2);
            secondWorkerReady.resolve(secondWorker);
            await waitFor(() => processed.length == 2);
            assert.deepStrictEqual(processed, [1, 2]);
            assert(firstWorker.relieved);
        }
        finally {
            subscription.unsubscribe();
        }
    });
    test('errors when pending request cap is exceeded', async () => {
        const request$ = new rxjs.Subject;
        const workerReady = defer();
        const error = defer();
        makeWorkerRotator({
            makeWorker: () => workerReady.promise,
            workerTtlMs: 1000,
            request$,
            maxPendingRequests: 1
        }).subscribe({
            error: err => error.resolve(err)
        });
        request$.next(1);
        request$.next(2);
        const err = await error.promise;
        assert(err instanceof Error);
        assert.equal(err.message, 'Worker rotator exceeded max pending requests (1)');
    });
    test('emits lifecycle events', async () => {
        const request$ = new rxjs.Subject;
        const worker = makeTestWorker();
        const events = [];
        const subscription = makeWorkerRotator({
            makeWorker: async () => worker,
            workerTtlMs: 1000,
            request$
        }).subscribe(event => events.push(event));
        try {
            await waitFor(() => events.length >= 1);
            worker.quit$.next('done');
            await waitFor(() => events.length >= 3);
            assert.deepStrictEqual(events.slice(0, 3).map(event => event.type), ['hired', 'quit', 'relieved']);
            assert.equal(events[1].type == 'quit' && events[1].reason, 'done');
        }
        finally {
            subscription.unsubscribe();
        }
    });
});
function makeTestWorker() {
    const processRequests$ = new rxjs.Subject;
    return {
        processCalls: 0,
        processRequests$,
        quit$: new rxjs.Subject(),
        relieved: false,
        process(request$) {
            this.processCalls++;
            return request$.pipe(rxjs.tap(request => processRequests$.next(request)), rxjs.ignoreElements());
        },
        relieve() {
            this.relieved = true;
        }
    };
}
function defer() {
    let resolve;
    let reject;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}
async function waitFor(condition) {
    for (let i = 0; i < 100; i++) {
        if (condition())
            return;
        await new Promise(resolve => setTimeout(resolve, 1));
    }
    assert(condition());
}
