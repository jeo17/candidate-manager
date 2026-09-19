<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Search, SlidersHorizontal, X, ArrowDownWideNarrow } from 'lucide-vue-next'
import { useCandidates } from '../stores/candidates'
import { label } from '../utils/presentation'
import { useDebouncedCallback } from '@/shared/composables/useDebouncedCallback'
const store = useCandidates()
const search = ref(store.filters.search)
const expanded = ref(false)
const { debounce: debounceSearch } = useDebouncedCallback((value: string) => {
  if (value !== store.filters.search) store.setFilters({ search: value })
})
watch(search, debounceSearch)
watch(
  () => store.filters.search,
  (value) => {
    search.value = value
  },
)
const activeCount = computed(
  () =>
    ['position', 'skill', 'from', 'to', 'experience'].filter(
      (key) => store.filters[key as keyof typeof store.filters],
    ).length,
)
const hasFilters = computed(
  () => activeCount.value > 0 || store.filters.search || store.filters.status,
)
function change(key: 'position' | 'skill' | 'from' | 'to' | 'experience', event: Event) {
  store.setFilters({ [key]: (event.target as HTMLInputElement).value })
}
</script>
<template>
  <div class="filter-toolbar">
    <div class="search-field">
      <Search :size="18" /><input
        v-model="search"
        aria-label="Search candidates"
        placeholder="Search by name, role, or keyword…"
      /><kbd>/</kbd>
    </div>
    <div class="flex items-center gap-2">
      <button
        class="btn btn-secondary filter-button"
        :class="{ selected: expanded || activeCount }"
        :aria-expanded="expanded"
        aria-controls="advanced-filters"
        @click="expanded = !expanded"
      >
        <SlidersHorizontal :size="16" />Filters<span v-if="activeCount" class="count-pill">{{
          activeCount
        }}</span></button
      ><label class="sort-field"
        ><ArrowDownWideNarrow :size="16" /><select
          aria-label="Sort candidates"
          :value="store.filters.sort"
          @change="
            store.setFilters({
              sort: ($event.target as HTMLSelectElement).value as 'newest' | 'oldest' | 'name',
            })
          "
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A–Z</option>
        </select></label
      >
    </div>
  </div>
  <div v-if="expanded" id="advanced-filters" class="advanced-filters">
    <label
      >Position<select :value="store.filters.position" @change="change('position', $event)">
        <option value="">All positions</option>
        <option v-for="position in store.positions" :key="position.id" :value="position.titre">
          {{ label(position.titre) }}
        </option>
      </select></label
    >
    <label
      >Skill<select :value="store.filters.skill" @change="change('skill', $event)">
        <option value="">All skills</option>
        <option v-for="skill in store.skills" :key="skill.id" :value="skill.nom">
          {{ skill.nom }}
        </option>
      </select></label
    >
    <label
      >Applied from<input
        type="date"
        :value="store.filters.from"
        :max="store.filters.to || undefined"
        @change="change('from', $event)"
    /></label>
    <label
      >Applied until<input
        type="date"
        :value="store.filters.to"
        :min="store.filters.from || undefined"
        @change="change('to', $event)"
    /></label>
    <label
      >Experience (exact)<input
        placeholder="e.g. 3 ans"
        :value="store.filters.experience"
        @change="change('experience', $event)"
    /></label>
  </div>
  <div v-if="hasFilters" class="active-filters">
    <span
      >Filtered results<span v-if="store.filters.skill"> · {{ store.filters.skill }}</span
      ><span v-if="store.filters.position"> · {{ label(store.filters.position) }}</span></span
    ><button @click="store.resetFilters"><X :size="13" /> Clear all filters</button>
  </div>
</template>
