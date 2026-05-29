import * as rxjs from "rxjs";
export interface Worker<R> {
    process(request$: rxjs.Observable<R>): rxjs.Observable<never>;
    relieve(): void;
    quit$: rxjs.Observable<unknown>;
}
export type WorkerRotatorEvent<W> = {
    type: 'hired' | 'relieved';
    worker: W;
} | {
    type: 'quit';
    worker: W;
    reason: unknown;
};
export interface WorkerRotatorOptions<R, W extends Worker<R>> {
    makeWorker: () => Promise<W>;
    workerTtlMs: number;
    request$: rxjs.Observable<R>;
    maxPendingRequests?: number;
    onEvent?: (event: WorkerRotatorEvent<W>) => void;
}
/**
 * Rotates workers over a request stream.
 * See the README for the lifecycle and buffering contract.
 */
export declare function makeWorkerRotator<R, W extends Worker<R>>({ makeWorker, workerTtlMs, request$, maxPendingRequests, onEvent }: WorkerRotatorOptions<R, W>): rxjs.Observable<never>;
