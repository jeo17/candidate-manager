import { describe, expect, it } from 'vitest'
import { AxiosError } from 'axios'
import { errorMessage } from './http'
describe('API failure feedback', () => {
  it('distinguishes offline, timeout, missing resources, and server failure', () => {
    expect(errorMessage(new AxiosError('offline'))).toContain('Unable to connect')
    expect(errorMessage(new AxiosError('timeout', 'ECONNABORTED'))).toContain('too long')
    expect(errorMessage({ isAxiosError: true, response: { status: 404 } })).toContain(
      'could not be found',
    )
    expect(errorMessage({ isAxiosError: true, response: { status: 500 } })).toContain(
      'server is having trouble',
    )
  })
})
