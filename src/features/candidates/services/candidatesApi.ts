import { http } from '@/shared/api/http'
import type {
  Candidate,
  CandidateFilters,
  CandidateInput,
  CandidateStatus,
  Position,
  Skill,
} from '../types'

export function queryParams(filters: CandidateFilters, page: number, limit: number) {
  const params: Record<string, string | number> = {
    _page: page,
    _limit: limit,
    _sort: filters.sort === 'name' ? 'nom' : 'dateCandidature',
    _order: filters.sort === 'newest' ? 'desc' : 'asc',
  }
  if (filters.search.trim()) params.q = filters.search.trim()
  if (filters.status) params.statut = filters.status
  if (filters.position) params.poste = filters.position
  // Escape regex metacharacters so Vue.js and Node.js are literal skill names.
  if (filters.skill)
    params.competences_like = `(^|,)${filters.skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(,|$)`
  if (filters.experience) params.experience = filters.experience
  if (filters.from) params.dateCandidature_gte = `${filters.from}T00:00:00`
  if (filters.to) params.dateCandidature_lte = `${filters.to}T23:59:59.999Z`
  return params
}

export const candidatesApi = {
  async list(filters: CandidateFilters, page: number, limit: number, signal?: AbortSignal) {
    const response = await http.get<Candidate[]>('/candidatures', {
      params: queryParams(filters, page, limit),
      signal,
    })
    return {
      items: response.data,
      total: Number(response.headers['x-total-count'] ?? response.data.length),
    }
  },
  async detail(id: number) {
    return (await http.get<Candidate>(`/candidatures/${id}`)).data
  },
  async create(input: CandidateInput) {
    return (await http.post<Candidate>('/candidatures', input)).data
  },
  async update(id: number, patch: Partial<CandidateInput>) {
    return (await http.patch<Candidate>(`/candidatures/${id}`, patch)).data
  },
  async remove(id: number) {
    await http.delete(`/candidatures/${id}`)
  },
  async metadata() {
    const [statuses, positions, skills] = await Promise.all([
      http.get<CandidateStatus[]>('/statuts'),
      http.get<Position[]>('/postes'),
      http.get<Skill[]>('/competences'),
    ])
    return {
      statuses: statuses.data.sort((a, b) => a.ordre - b.ordre),
      positions: positions.data,
      skills: skills.data,
    }
  },
  async counts(statuses: CandidateStatus[]) {
    return Object.fromEntries(
      await Promise.all(
        statuses.map(async (status) => {
          const response = await http.get('/candidatures', {
            params: { statut: status.nom, _page: 1, _limit: 1 },
          })
          return [status.nom, Number(response.headers['x-total-count'] ?? 0)]
        }),
      ),
    ) as Record<string, number>
  },
}
