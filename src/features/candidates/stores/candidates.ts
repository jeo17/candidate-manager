import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import { candidatesApi } from '../services/candidatesApi'
import {
  emptyFilters,
  type Candidate,
  type CandidateFilters,
  type CandidateInput,
  type CandidateStatus,
  type Position,
  type Skill,
} from '../types'
import { errorMessage } from '@/shared/api/http'
import { readStorage, writeStorage } from '@/shared/utils/storage'
import { toast } from 'vue-sonner'

function savedFilters(): CandidateFilters {
  const defaults = emptyFilters()
  const saved = readStorage<Partial<CandidateFilters>>('folio:filters', {})
  for (const key of Object.keys(defaults) as (keyof CandidateFilters)[]) {
    if (typeof saved?.[key] === 'string') Object.assign(defaults, { [key]: saved[key] })
  }
  if (!['newest', 'oldest', 'name'].includes(defaults.sort)) defaults.sort = 'newest'
  return defaults
}

export const useCandidates = defineStore('candidates', () => {
  const items = ref<Candidate[]>([]),
    total = ref(0),
    page = ref(1),
    pageSize = ref(8)
  const filters = ref(savedFilters())
  const view = ref<'list' | 'board'>(
    readStorage<string>('folio:view', 'list') === 'board' ? 'board' : 'list',
  )
  const statuses = ref<CandidateStatus[]>([]),
    positions = ref<Position[]>([]),
    skills = ref<Skill[]>([])
  const counts = ref<Record<string, number>>({}),
    loading = ref(false),
    error = ref(''),
    metadataError = ref(''),
    countsError = ref('')
  const pendingIds = ref(new Set<number>())
  const activeCandidate = ref<Candidate | null>(null)
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
  const allCount = computed(() =>
    Object.values(counts.value).reduce((sum, count) => sum + count, 0),
  )
  let metadataAt = 0,
    sequence = 0,
    controller: AbortController | undefined
  const cache = new Map<string, { items: Candidate[]; total: number; at: number }>()
  watch(filters, (value) => writeStorage('folio:filters', value), { deep: true })
  watch(view, (value) => writeStorage('folio:view', value))

  async function load(force = false) {
    const request = ++sequence
    controller?.abort()
    controller = new AbortController()
    const key = JSON.stringify([filters.value, page.value, pageSize.value])
    const cached = cache.get(key)
    error.value = ''
    if (!force && cached && Date.now() - cached.at < 30000) {
      items.value = structuredClone(cached.items)
      total.value = cached.total
      loading.value = false
      return
    }
    loading.value = true
    try {
      const result = await candidatesApi.list(
        filters.value,
        page.value,
        pageSize.value,
        controller.signal,
      )
      if (request !== sequence) return
      items.value = result.items
      total.value = result.total
      if (page.value > pageCount.value) {
        page.value = pageCount.value
        await load(force)
        return
      }
      if (cache.size >= 20) cache.delete(cache.keys().next().value!)
      cache.set(key, { ...structuredClone(result), at: Date.now() })
    } catch (cause) {
      if (request === sequence && !axios.isCancel(cause)) {
        error.value = errorMessage(cause)
        items.value = []
      }
    } finally {
      if (request === sequence) loading.value = false
    }
  }
  async function loadMetadata(force = false) {
    if (!force && metadataAt && Date.now() - metadataAt < 300000) return
    metadataError.value = ''
    try {
      const data = await candidatesApi.metadata()
      statuses.value = data.statuses
      positions.value = data.positions
      skills.value = data.skills
      metadataAt = Date.now()
    } catch (cause) {
      metadataError.value = errorMessage(cause)
    }
  }
  async function loadCounts() {
    countsError.value = ''
    try {
      counts.value = await candidatesApi.counts(statuses.value)
    } catch {
      countsError.value = 'Overview could not be refreshed.'
    }
  }
  async function initialize(force = false) {
    await Promise.all([loadMetadata(force), load(force)])
    if (!metadataError.value) await loadCounts()
  }
  function setFilters(patch: Partial<CandidateFilters>) {
    filters.value = { ...filters.value, ...patch }
    page.value = 1
    void load()
  }
  function resetFilters() {
    filters.value = emptyFilters()
    page.value = 1
    void load()
  }
  function setPage(value: number) {
    page.value = Math.min(Math.max(value, 1), pageCount.value)
    void load()
  }
  function setPageSize(value: number) {
    pageSize.value = Math.min(100, Math.max(5, Math.round(value)))
    page.value = 1
    void load()
  }
  async function reconcile() {
    cache.clear()
    await Promise.all([load(true), loadCounts()])
  }
  async function update(candidate: Candidate, patch: Partial<CandidateInput>) {
    if (pendingIds.value.has(candidate.id)) return null
    pendingIds.value.add(candidate.id)
    // Cancel an older list response before applying an optimistic change.
    ++sequence
    controller?.abort()
    loading.value = false
    cache.clear()
    const before = JSON.parse(JSON.stringify(candidate)) as Candidate
    const notification = toast.loading('Saving…')
    Object.assign(candidate, patch)
    const listed = items.value.find((item) => item.id === candidate.id)
    if (listed && listed !== candidate) Object.assign(listed, patch)
    try {
      const saved = await candidatesApi.update(candidate.id, patch)
      Object.assign(candidate, saved)
      if (activeCandidate.value?.id === saved.id) activeCandidate.value = saved
      toast.success(
        patch.commentaires
          ? 'Note added'
          : patch.statut && Object.keys(patch).length === 1
            ? 'Stage updated'
            : 'Candidate updated',
        { id: notification },
      )
      await reconcile()
      return saved
    } catch (cause) {
      Object.assign(candidate, before)
      const current = items.value.find((item) => item.id === candidate.id)
      if (current) Object.assign(current, before)
      toast.error(errorMessage(cause), { id: notification, duration: Infinity })
      return null
    } finally {
      pendingIds.value.delete(candidate.id)
    }
  }
  async function create(input: CandidateInput) {
    const notification = toast.loading('Adding candidate…')
    try {
      const candidate = await candidatesApi.create(input)
      toast.success('Candidate added', { id: notification })
      await reconcile()
      return candidate
    } catch (cause) {
      toast.error(errorMessage(cause), { id: notification, duration: Infinity })
      return null
    }
  }
  async function remove(id: number) {
    if (pendingIds.value.has(id)) return false
    pendingIds.value.add(id)
    const notification = toast.loading('Deleting candidate…')
    try {
      await candidatesApi.remove(id)
      // Navigate as soon as DELETE succeeds; the listing refreshes when it mounts.
      ++sequence
      controller?.abort()
      loading.value = false
      cache.clear()
      const deleted = items.value.find((item) => item.id === id)
      items.value = items.value.filter((item) => item.id !== id)
      if (deleted) total.value = Math.max(0, total.value - 1)
      page.value = Math.min(page.value, pageCount.value)
      if (activeCandidate.value?.id === id) activeCandidate.value = null
      toast.success('Candidate deleted', { id: notification })
      return true
    } catch (cause) {
      toast.error(errorMessage(cause), { id: notification, duration: Infinity })
      return false
    } finally {
      pendingIds.value.delete(id)
    }
  }
  return {
    activeCandidate,
    items,
    total,
    page,
    pageSize,
    filters,
    view,
    statuses,
    positions,
    skills,
    counts,
    loading,
    error,
    metadataError,
    countsError,
    pendingIds,
    pageCount,
    allCount,
    load,
    loadMetadata,
    initialize,
    loadCounts,
    setFilters,
    resetFilters,
    setPage,
    setPageSize,
    update,
    create,
    remove,
  }
})
