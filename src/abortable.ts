
export function makeAbortable() {
  let isAborted: {reason: unknown}
  let reject: (reason: unknown) => void
  const promise = new Promise<never>((f,r) => reject=r)

  function abort(reason: unknown) {
    isAborted = {reason}
    reject(reason)
  }
  function checkpoint() {
    if (isAborted) throw isAborted.reason
  }

  return [
    abort,
    promise,
    checkpoint
  ] as const
}
