import { describe, expect, it, vi } from 'vitest'
import { candidatesApi, queryParams } from './candidatesApi'
import { emptyFilters } from '../types'
import { http } from '@/shared/api/http'
vi.mock('@/shared/api/http', () => ({
  http: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))
describe('JSON Server API contract', () => {
  it('combines server search, escaped skill matching, filters, sorting and pagination', () => {
    expect(
      queryParams(
        {
          ...emptyFilters(),
          search: '  Sophie ',
          status: 'En attente',
          skill: 'Vue.js',
          from: '2024-01-01',
          to: '2024-01-31',
          position: 'Développeur Frontend',
          sort: 'name',
        },
        2,
        8,
      ),
    ).toEqual({
      q: 'Sophie',
      statut: 'En attente',
      poste: 'Développeur Frontend',
      competences_like: '(^|,)Vue\\.js(,|$)',
      dateCandidature_gte: '2024-01-01T00:00:00',
      dateCandidature_lte: '2024-01-31T23:59:59.999Z',
      _page: 2,
      _limit: 8,
      _sort: 'nom',
      _order: 'asc',
    })
  })
  it('reads the total from response headers rather than the current page length', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: [{ id: 1 }], headers: { 'x-total-count': '12' } })
    expect(await candidatesApi.list(emptyFilters(), 1, 8)).toEqual({
      items: [{ id: 1 }],
      total: 12,
    })
  })
  it('uses PATCH for updates and DELETE for removal', async () => {
    vi.mocked(http.patch).mockResolvedValue({ data: { id: 3, statut: 'Accepté' } })
    await candidatesApi.update(3, { statut: 'Accepté' })
    await candidatesApi.remove(3)
    expect(http.patch).toHaveBeenCalledWith('/candidatures/3', { statut: 'Accepté' })
    expect(http.delete).toHaveBeenCalledWith('/candidatures/3')
  })
})
