import { getCurrentScope, onScopeDispose } from 'vue'

export function useDebouncedCallback<Arguments extends unknown[]>(
  callback: (...args: Arguments) => void,
  delay = 300,
) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let pendingArguments: Arguments | undefined

  function cancel() {
    if (timer) clearTimeout(timer)
    timer = undefined
    pendingArguments = undefined
  }

  function flush() {
    if (!pendingArguments) return
    if (timer) clearTimeout(timer)
    timer = undefined
    const args = pendingArguments
    pendingArguments = undefined
    callback(...args)
  }

  function debounce(...args: Arguments) {
    pendingArguments = args
    if (timer) clearTimeout(timer)
    timer = setTimeout(flush, delay)
  }

  if (getCurrentScope()) onScopeDispose(cancel)

  return { debounce, flush, cancel }
}
