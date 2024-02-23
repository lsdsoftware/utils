interface Closeable {
    close(): void;
    once(event: "close", callback: Function): void;
}
export interface ConnectionManager<Connection> {
    get(): Promise<Connection>;
    shutdown(): void;
}
export declare function makeConnectionManager<Connection extends Closeable>({ connect, retryDelay }: {
    connect(): Promise<Connection>;
    retryDelay: number;
}): ConnectionManager<Connection>;
export {};
