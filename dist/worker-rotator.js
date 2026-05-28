import * as rxjs from "rxjs";
/**
 * Rotates workers over a request stream and emits worker lifecycle events.
 * See the README for the lifecycle and buffering contract.
 */
export function makeWorkerRotator({ makeWorker, workerTtlMs, request$, maxPendingRequests = Infinity }) {
    return rxjs.defer(() => {
        if (maxPendingRequests !== Infinity && (!Number.isInteger(maxPendingRequests) || maxPendingRequests < 0)) {
            throw new RangeError('maxPendingRequests must be a non-negative integer or Infinity');
        }
        const eventSubject = new rxjs.ReplaySubject(1);
        return rxjs.defer(() => makeWorker()).pipe(rxjs.tap(worker => eventSubject?.next({ type: 'hired', worker })), rxjs.exhaustMap(worker => rxjs.NEVER.pipe(rxjs.startWith(worker), rxjs.takeUntil(rxjs.race(worker.quit$, rxjs.timer(workerTtlMs).pipe(rxjs.map(() => 'Worker TTL expired'))).pipe(rxjs.tap(reason => eventSubject?.next({ type: 'quit', worker, reason })))), rxjs.endWith(null), rxjs.finalize(() => {
            worker.relieve();
            eventSubject?.next({ type: 'relieved', worker });
        }))), rxjs.repeat(), rxjs.share(), worker$ => request$.pipe(rxjs.window(worker$), rxjs.zipWith(worker$.pipe(rxjs.startWith(null))), rxjs.mergeScan((pending, [window$, worker]) => rxjs.concat(pending, window$).pipe(worker
            ? request$ => worker.process(request$).pipe(rxjs.startWith([]))
            : request$ => request$.pipe(bufferRequests(maxPendingRequests))), []), rxjs.ignoreElements()), rxjs.mergeWith(eventSubject));
    });
}
function bufferRequests(maxPendingRequests) {
    return request$ => request$.pipe(rxjs.reduce((pending, request) => {
        if (pending.length >= maxPendingRequests) {
            throw new Error(`Worker rotator exceeded max pending requests (${maxPendingRequests})`);
        }
        pending.push(request);
        return pending;
    }, []));
}
