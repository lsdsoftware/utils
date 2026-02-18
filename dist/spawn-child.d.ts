import { ChildProcess } from "child_process";
import * as rxjs from "rxjs";
export declare function spawnChild<T extends ChildProcess>(spawn: () => T): rxjs.Observable<{
    process: T;
    stdout$: rxjs.Observable<string | Buffer<ArrayBufferLike>>;
    stderr$: rxjs.Observable<string | Buffer<ArrayBufferLike>>;
    error$: rxjs.Observable<Error>;
    close$: rxjs.Observable<number | NodeJS.Signals>;
}>;
