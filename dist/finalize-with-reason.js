import { defer, finalize, tap } from "rxjs";
export function finalizeWithReason(onTeardown) {
    return (source$) => defer(() => {
        let reason = "unsubscribe";
        return source$.pipe(tap({
            complete: () => { reason = "complete"; },
            error: () => { reason = "error"; },
        }), finalize(() => onTeardown(reason)));
    });
}
