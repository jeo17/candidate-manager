import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { useCandidates } from './candidates'
import { candidatesApi } from '../services/candidatesApi'
import type { Candidate } from '../types'
import { toast } from 'vue-sonner'
vi.mock('vue-sonner', () => ({ toast: { loading: vi.fn(), success: vi.fn(), error: vi.fn() } }))
vi.mock('../services/candidatesApi', () => ({
  candidatesApi: {
    list: vi.fn(),
    metadata: vi.fn(),
    counts: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    remove: vi.fn(),
  },
}))
const fixture: Candidate = {
  id: 1,
  nom: 'Test Candidate',
  email: 'test@example.com',
  poste: 'Developer',
  statut: 'En attente',
  competences: ['Vue.js'],
  experience: '3 years',
  dateCandidature: '2024-01-01T10:00:00Z',
  telephone: '',
  cv: '',
  lettreMotivation: '',
  salaireSouhaite: 42000,
  disponibilite: '',
  localisation: '',
  commentaires: [],
}
beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  vi.resetAllMocks()
  vi.mocked(candidatesApi.list).mockResolvedValue({ items: [{ ...fixture }], total: 1 })
  vi.mocked(candidatesApi.metadata).mockResolvedValue({ statuses: [], positions: [], skills: [] })
  vi.mocked(candidatesApi.counts).mockResolvedValue({})
})
describe('candidate state', () => {
  it('optimistically changes a stage and restores it when PATCH fails', async () => {
    const store = useCandidates()
    await store.load()
    let reject!: (reason: Error) => void
    vi.mocked(candidatesApi.update).mockReturnValue(
      new Promise((_, no) => {
        reject = no
      }),
    )
    const record = store.items[0]!
    const request = store.update(record, { statut: 'Accepté' })
    expect(record.statut).toBe('Accepté')
    expect(store.pendingIds.has(1)).toBe(true)
    reject(new Error('offline'))
    expect(await request).toBeNull()
    expect(record.statut).toBe('En attente')
    expect(store.pendingIds.size).toBe(0)
    expect(toast.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ duration: Infinity }),
    )
  })
  it('ignores stale responses after a newer search resolves', async () => {
    let resolve!: (value: { items: Candidate[]; total: number }) => void
    vi.mocked(candidatesApi.list).mockReturnValueOnce(
      new Promise((yes) => {
        resolve = yes
      }),
    )
    const store = useCandidates()
    const first = store.load()
    store.filters.search = 'new'
    await store.load()
    resolve({ items: [{ ...fixture, id: 99 }], total: 1 })
    await first
    expect(store.items[0]?.id).toBe(1)
  })
  it('caches reads, forces refresh, and invalidates after writes', async () => {
    const store = useCandidates()
    await store.load()
    await store.load()
    expect(candidatesApi.list).toHaveBeenCalledTimes(1)
    await store.load(true)
    expect(candidatesApi.list).toHaveBeenCalledTimes(2)
    vi.mocked(candidatesApi.update).mockResolvedValue({ ...fixture, statut: 'Accepté' })
    await store.update(store.items[0]!, { statut: 'Accepté' })
    expect(candidatesApi.list).toHaveBeenCalledTimes(3)
  })
  it('preserves active filters and view preference', async () => {
    const store = useCandidates()
    store.filters.skill = 'Vue.js'
    store.view = 'board'
    await nextTick()
    setActivePinia(createPinia())
    const restored = useCandidates()
    expect(restored.filters.skill).toBe('Vue.js')
    expect(restored.view).toBe('board')
  })
  it('caches metadata and supports explicit refresh', async () => {
    const store = useCandidates()
    await store.loadMetadata()
    await store.loadMetadata()
    await store.loadMetadata(true)
    expect(candidatesApi.metadata).toHaveBeenCalledTimes(2)
  })
  it('bounds a custom page size between 5 and 100 and returns to page one', async () => {
    const store = useCandidates()
    store.page = 3
    store.setPageSize(2)
    expect(store.pageSize).toBe(5)
    expect(store.page).toBe(1)
    store.setPageSize(150)
    expect(store.pageSize).toBe(100)
  })
  it('moves back a page when deleting the only row on the last page', async () => {
    const store = useCandidates()
    store.page = 2
    store.total = 9
    store.items = [{ ...fixture, id: 9 }]
    await store.remove(9)
    expect(store.page).toBe(1)
    expect(store.items).toHaveLength(0)
    expect(candidatesApi.list).not.toHaveBeenCalled()
  })
})
