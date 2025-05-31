/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { ChildProcessWithoutNullStreams, SpawnOptionsWithoutStdio } from "child_process";
import * as rxjs from "rxjs";
export interface Child {
    pid: number;
    stdout$: rxjs.Observable<string | Buffer>;
    stderr$: rxjs.Observable<string | Buffer>;
    error$: rxjs.Observable<Error>;
    close$: rxjs.Observable<number | NodeJS.Signals>;
    stdin: ChildProcessWithoutNullStreams['stdin'];
    kill: ChildProcessWithoutNullStreams['kill'];
}
export declare function spawnChild(command: string, args?: string[], options?: SpawnOptionsWithoutStdio): rxjs.Observable<Child>;
