import { Observable } from "rxjs";
export declare function finalizeWithReason<T>(onTeardown: (reason: "complete" | "error" | "unsubscribe") => void): (source$: Observable<T>) => Observable<T>;
