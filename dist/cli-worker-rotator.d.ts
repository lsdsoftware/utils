import type { ChildProcessByStdio } from "child_process";
import * as rxjs from "rxjs";
import type { Readable, Writable } from "stream";
import { WorkerRotatorEvent } from "./worker-rotator.js";
export type CLIWorker = ChildProcessByStdio<Writable, Readable, null>;
export type CLIWorkerRotatorEvent = WorkerRotatorEvent<CLIWorker>;
export interface CLIRequest {
    input: string;
    output$: rxjs.SubjectLike<string>;
}
export interface CLIWorkerRotatorOptions {
    spawnWorkerProcess: () => CLIWorker;
    workerTtlMs: number;
    request$: rxjs.Observable<CLIRequest>;
    maxPendingRequests?: number;
}
/**
 * Rotates child processes that communicate over stdin/stdout using a
 * line-oriented request/response protocol, such as JSONL.
 * See the README for the protocol and lifecycle contract.
 */
export declare function makeCLIWorkerRotator({ spawnWorkerProcess, workerTtlMs, request$, maxPendingRequests }: CLIWorkerRotatorOptions): rxjs.Observable<CLIWorkerRotatorEvent>;
