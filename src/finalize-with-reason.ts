import { Observable, defer, finalize, tap } from "rxjs"

export function finalizeWithReason<T>(
  onTeardown: (reason: "complete" | "error" | "unsubscribe") => void
) {
  return (source$: Observable<T>) =>
    defer(() => {
      let reason: "complete" | "error" | "unsubscribe" = "unsubscribe"

      return source$.pipe(
        tap({
          complete: () => { reason = "complete" },
          error: () => { reason = "error" },
        }),
        finalize(() => onTeardown(reason))
      )
    })
}
