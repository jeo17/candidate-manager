import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import CandidateFilters from './CandidateFilters.vue'
import { candidatesApi } from '../services/candidatesApi'
vi.mock('../services/candidatesApi', () => ({
  candidatesApi: { list: vi.fn().mockResolvedValue({ items: [], total: 0 }) },
}))
beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  vi.useFakeTimers()
})
afterEach(() => vi.useRealTimers())
it('debounces typing into one server request', async () => {
  const wrapper = mount(CandidateFilters)
  const input = wrapper.get('input[aria-label="Search candidates"]')
  await input.setValue('S')
  await input.setValue('So')
  await input.setValue('Sophie')
  await vi.advanceTimersByTimeAsync(299)
  expect(candidatesApi.list).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(1)
  await flushPromises()
  expect(candidatesApi.list).toHaveBeenCalledTimes(1)
  expect(vi.mocked(candidatesApi.list).mock.calls[0]?.[0].search).toBe('Sophie')
  wrapper.unmount()
})
