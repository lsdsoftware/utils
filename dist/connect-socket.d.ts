import { NetConnectOpts, Socket } from "net";
import * as rxjs from "rxjs";
export interface Connection {
    socket: Socket;
    data$: rxjs.Observable<string | Buffer>;
    error$: rxjs.Observable<Error>;
    timeout$: rxjs.Observable<void>;
    close$: rxjs.Observable<boolean>;
}
export declare function connectSocket(options: NetConnectOpts & {
    encoding?: BufferEncoding;
}): rxjs.Observable<Connection>;
