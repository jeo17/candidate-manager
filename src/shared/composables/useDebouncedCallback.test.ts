import { effectScope } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDebouncedCallback } from './useDebouncedCallback'

describe('useDebouncedCallback', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('runs only the latest call after the delay and cancels on scope disposal', async () => {
    const callback = vi.fn()
    const scope = effectScope()
    const control = scope.run(() => useDebouncedCallback(callback, 300))!

    control.debounce('first')
    control.debounce('latest')
    await vi.advanceTimersByTimeAsync(299)
    expect(callback).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(callback).toHaveBeenCalledOnce()
    expect(callback).toHaveBeenCalledWith('latest')

    control.debounce('cancelled')
    scope.stop()
    await vi.advanceTimersByTimeAsync(300)
    expect(callback).toHaveBeenCalledOnce()
  })

  it('can flush a pending call immediately', () => {
    const callback = vi.fn()
    const { debounce, flush } = useDebouncedCallback(callback)
    debounce(25)
    flush()
    expect(callback).toHaveBeenCalledWith(25)
  })
})
