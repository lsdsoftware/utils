export declare function makeSemaphore(count: number): {
    runTask<T>(task: () => Promise<T>): Promise<T>;
};
