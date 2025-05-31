/// <reference types="node" />
/// <reference types="node" />
import { NetConnectOpts, Socket } from "net";
import * as rxjs from "rxjs";
export interface Connection {
    data$: rxjs.Observable<string | Buffer>;
    error$: rxjs.Observable<Error>;
    close$: rxjs.Observable<string>;
    write: Socket['write'];
    end: Socket['end'];
}
export declare function connectSocket(options: NetConnectOpts & {
    timeout?: number;
    encoding?: BufferEncoding;
}): rxjs.Observable<Connection>;
