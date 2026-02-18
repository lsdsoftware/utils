import * as rxjs from "rxjs";
export function spawnChild(spawn) {
    const child = spawn();
    return rxjs.race(rxjs.fromEvent(child, 'error', (err) => err).pipe(rxjs.map(err => { throw err; })), rxjs.fromEvent(child, 'spawn').pipe(rxjs.take(1), rxjs.map(() => ({
        process: child,
        stdout$: child.stdout
            ? rxjs.fromEvent(child.stdout, 'data')
            : rxjs.EMPTY,
        stderr$: child.stderr
            ? rxjs.fromEvent(child.stderr, 'data')
            : rxjs.EMPTY,
        error$: rxjs.fromEvent(child, 'error'),
        close$: rxjs.fromEvent(child, 'close', (code, signal) => signal || code).pipe(rxjs.take(1)),
    }))));
}
