import { describe } from "@service-broker/test-utils";
import assert from "assert";
import { EventEmitter } from "events";
import * as rxjs from "rxjs";
import { PassThrough, Writable } from "stream";
import { makeCLIWorkerRotator } from "./cli-worker-rotator.js";
describe('cli-worker-rotator', ({ test }) => {
    test('pairs stdout lines with requests in order', async () => {
        const request$ = new rxjs.Subject;
        const child = makeEchoChild();
        const firstOutput$ = new rxjs.Subject;
        const secondOutput$ = new rxjs.Subject;
        const subscription = makeCLIWorkerRotator({
            spawnWorkerProcess: () => child,
            workerTtlMs: 1000,
            request$
        }).subscribe();
        try {
            request$.next({ input: 'one', output$: firstOutput$ });
            request$.next({ input: 'two', output$: secondOutput$ });
            const outputs = await Promise.all([
                rxjs.firstValueFrom(firstOutput$),
                rxjs.firstValueFrom(secondOutput$)
            ]);
            assert.deepStrictEqual(outputs, ['ONE', 'TWO']);
        }
        finally {
            subscription.unsubscribe();
        }
    });
});
function makeEchoChild() {
    const child = new EventEmitter();
    const stdout = new PassThrough();
    let remainder = '';
    child.stdin = new Writable({
        write(chunk, _encoding, callback) {
            remainder += chunk.toString();
            const lines = remainder.split(/\r?\n/);
            remainder = lines.pop();
            for (const line of lines) {
                stdout.write(line.toUpperCase() + '\n');
            }
            callback();
        }
    });
    child.stdout = stdout;
    child.stderr = null;
    setTimeout(() => child.emit('spawn'), 0);
    return child;
}
