"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockTimer = void 0;
function mockTimer() {
    const queue = [];
    return {
        sleep(duration) {
            return new Promise(f => queue.push({ callback: f, duration }));
        },
        run() {
            queue.sort((a, b) => a.duration - b.duration);
            for (const { callback } of queue)
                callback();
        }
    };
}
exports.mockTimer = mockTimer;
