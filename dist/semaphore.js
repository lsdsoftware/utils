export function makeSemaphore(count) {
    const waiters = [];
    return {
        async runTask(task, onStart) {
            if (count > 0)
                count--;
            else
                await new Promise(f => waiters.push(f));
            try {
                onStart?.();
                return await task();
            }
            finally {
                count++;
                while (count > 0 && waiters.length > 0) {
                    count--;
                    waiters.shift()();
                }
            }
        }
    };
}
