<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  ArrowDownToLine,
  BriefcaseBusiness,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Columns3,
  List,
  Plus,
  RefreshCw,
  Users,
  UserRoundCheck,
} from 'lucide-vue-next'
import { useCandidates } from '../stores/candidates'
import { label } from '../utils/presentation'
import CandidateFilters from './CandidateFilters.vue'
import CandidateTable from './CandidateTable.vue'
import CandidateBoard from './CandidateBoard.vue'
import FeedbackState from '@/shared/components/FeedbackState.vue'
import { useDebouncedCallback } from '@/shared/composables/useDebouncedCallback'
const store = useCandidates()
const pageSizeInput = ref(store.pageSize)
function commitPageSize(value: number | string) {
  const numericValue = Number(value)
  const bounded = Number.isFinite(numericValue)
    ? Math.min(100, Math.max(5, Math.round(numericValue)))
    : store.pageSize
  pageSizeInput.value = bounded
  if (bounded !== store.pageSize) store.setPageSize(bounded)
}
const { debounce: debouncePageSize, flush: flushPageSize } = useDebouncedCallback(commitPageSize)
watch(pageSizeInput, debouncePageSize)
watch(
  () => store.pageSize,
  (value) => {
    if (pageSizeInput.value !== value) pageSizeInput.value = value
  },
)
const activeFilters = computed(() =>
  Object.entries(store.filters).some(([key, value]) => key !== 'sort' && value),
)
const metrics = computed(() => [
  {
    name: 'Total candidates',
    value: store.allCount,
    icon: Users,
    class: 'total',
  },
  {
    name: 'To review',
    value: store.counts['En attente'] || 0,
    icon: BriefcaseBusiness,
    class: 'review',
  },
  {
    name: 'In interviews',
    value: (store.counts['Entretien RH'] || 0) + (store.counts['Entretien technique'] || 0),
    icon: UserRoundCheck,
    class: 'interview',
  },
  {
    name: 'Hired',
    value: store.counts['Accepté'] || 0,
    icon: CheckCheck,
    class: 'hired',
  },
])
function shortcut(event: KeyboardEvent) {
  if (
    event.key === '/' &&
    !(event.target instanceof HTMLInputElement) &&
    !(event.target instanceof HTMLTextAreaElement) &&
    !(event.target instanceof HTMLSelectElement)
  ) {
    event.preventDefault()
    document.querySelector<HTMLInputElement>('[aria-label="Search candidates"]')?.focus()
  }
}
function exportPage() {
  const cell = (value: string) => `"${value.replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`
  const rows = [
    ['Name', 'Email', 'Position', 'Stage', 'Applied'],
    ...store.items.map((item) => [
      item.nom,
      item.email,
      label(item.poste),
      label(item.statut),
      item.dateCandidature,
    ]),
  ]
  const url = URL.createObjectURL(
    new Blob(['\ufeff' + rows.map((row) => row.map(cell).join(',')).join('\r\n')], {
      type: 'text/csv;charset=utf-8;',
    }),
  )
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `folio-candidates-page-${store.page}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}
onMounted(() => {
  void store.initialize()
  window.addEventListener('keydown', shortcut)
})
onUnmounted(() => window.removeEventListener('keydown', shortcut))
</script>
<template>
  <div>
    <section class="page-heading">
      <div>
        <h1 tabindex="-1">Candidates</h1>
      </div>
      <RouterLink to="/candidatures/nouvelle" class="btn btn-primary"
        ><Plus :size="18" />Add candidate</RouterLink
      >
    </section>
    <div class="metrics-grid">
      <article
        v-for="metric in metrics"
        :key="metric.name"
        class="metric-card"
        :class="metric.class"
      >
        <div class="metric-top">
          <span>{{ metric.name }}</span
          ><span class="metric-icon"><component :is="metric.icon" :size="18" /></span>
        </div>
        <strong>{{ store.countsError || store.metadataError ? '—' : metric.value }}</strong>
      </article>
    </div>
    <p v-if="store.countsError" role="status" class="inline-error">
      {{ store.countsError }} <button @click="store.loadCounts">Retry overview</button>
    </p>
    <section class="candidates-panel" aria-labelledby="candidates-heading">
      <h2 id="candidates-heading" class="sr-only">Candidate results</h2>
      <div class="candidate-toolbar">
        <div class="status-tabs" aria-label="Filter by stage">
          <button
            :class="{ active: !store.filters.status }"
            :aria-pressed="!store.filters.status"
            @click="store.setFilters({ status: '' })"
          >
            All candidates<span>{{ store.allCount }}</span></button
          ><button
            v-for="status in store.statuses"
            :key="status.id"
            :class="{ active: store.filters.status === status.nom }"
            :aria-pressed="store.filters.status === status.nom"
            @click="store.setFilters({ status: status.nom })"
          >
            {{ label(status.nom) }}<span>{{ store.counts[status.nom] || 0 }}</span>
          </button>
        </div>
        <div class="panel-actions">
          <button
            class="icon-button"
            aria-label="Refresh candidates"
            :disabled="store.loading"
            @click="store.initialize(true)"
          >
            <RefreshCw :size="16" :class="{ 'animate-spin': store.loading }" /></button
          ><button
            class="btn btn-secondary export-button"
            :disabled="!store.items.length || store.loading"
            @click="exportPage"
          >
            <ArrowDownToLine :size="15" />Export page
          </button>
          <div class="view-toggle" aria-label="Candidate view">
            <button
              :aria-pressed="store.view === 'list'"
              aria-label="List view"
              @click="store.view = 'list'"
            >
              <List :size="18" /></button
            ><button
              :aria-pressed="store.view === 'board'"
              aria-label="Board view"
              @click="store.view = 'board'"
            >
              <Columns3 :size="18" />
            </button>
          </div>
        </div>
      </div>
      <CandidateFilters />
      <FeedbackState
        v-if="store.metadataError"
        :error="store.metadataError"
        @retry="store.initialize(true)"
      />
      <div v-else :aria-busy="store.loading">
        <FeedbackState v-if="store.loading" loading /><FeedbackState
          v-else-if="store.error"
          :error="store.error"
          @retry="store.load(true)"
        /><FeedbackState
          v-else-if="!store.items.length"
          :title="activeFilters ? 'No candidates found' : 'No candidates yet'"
          :description="activeFilters ? 'Try another keyword or broaden your filters.' : undefined"
          ><button v-if="activeFilters" class="btn btn-secondary" @click="store.resetFilters">
            Clear filters</button
          ><RouterLink v-else to="/candidatures/nouvelle" class="btn btn-primary"
            >Add candidate</RouterLink
          ></FeedbackState
        ><CandidateTable v-else-if="store.view === 'list'" /><CandidateBoard v-else />
      </div>
      <div class="pagination">
        <div class="pagination-info">
          <span v-if="!store.error"
            >Showing
            <strong
              >{{ store.total ? (store.page - 1) * store.pageSize + 1 : 0 }}–{{
                Math.min(store.page * store.pageSize, store.total)
              }}</strong
            >
            of <strong>{{ store.total }}</strong> candidates</span
          ><label class="page-size-control"
            ><span>Rows</span
            ><input
              v-model.number="pageSizeInput"
              type="number"
              inputmode="numeric"
              min="5"
              max="100"
              step="1"
              aria-label="Candidates per page"
              @blur="flushPageSize"
              @keydown.enter.prevent="flushPageSize"
            /><small>5–100</small></label
          >
        </div>
        <nav aria-label="Pagination">
          <button
            class="pagination-arrow"
            :disabled="store.page === 1 || store.loading"
            aria-label="Previous page"
            @click="store.setPage(store.page - 1)"
          >
            <ChevronLeft :size="16" /></button
          ><span class="page-number" aria-current="page">{{ store.page }}</span
          ><span class="muted text-xs">of {{ store.pageCount }}</span
          ><button
            class="pagination-arrow"
            :disabled="store.page >= store.pageCount || store.loading"
            aria-label="Next page"
            @click="store.setPage(store.page + 1)"
          >
            <ChevronRight :size="16" />
          </button>
        </nav>
      </div>
    </section>
  </div>
</template>
