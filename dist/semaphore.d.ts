export declare function makeSemaphore(count: number): {
    runTask<T>(task: () => Promise<T>, checkpoint?: () => void): Promise<T>;
};
