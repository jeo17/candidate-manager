<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronRight, Layers2, Moon, Sun } from 'lucide-vue-next'
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'
import { useCandidates } from '@/features/candidates/stores/candidates'

const route = useRoute()
const candidates = useCandidates()
const dark = ref(document.documentElement.dataset.theme === 'dark')
const headerHidden = ref(false)
const header = ref<HTMLElement>()
let previousScroll = 0
const breadcrumbs = computed(() => {
  const crumbs: { label: string; to?: string }[] = [{ label: 'Candidates', to: '/candidatures' }]
  const id = Number(route.params.id)
  if (id) {
    const candidate =
      candidates.activeCandidate?.id === id
        ? candidates.activeCandidate
        : candidates.items.find((item) => item.id === id)
    crumbs.push({ label: candidate?.nom || `Candidate #${id}`, to: `/candidatures/${id}` })
  }
  if (route.name === 'candidate-create') crumbs.push({ label: 'Add candidate' })
  if (route.name === 'candidate-edit') crumbs.push({ label: 'Edit' })
  if (route.name === 'not-found') crumbs.push({ label: 'Page not found' })
  return crumbs
})
function toggleTheme() {
  dark.value = !dark.value
  document.documentElement.dataset.theme = dark.value ? 'dark' : 'light'
  try {
    localStorage.setItem('folio:theme', dark.value ? 'dark' : 'light')
  } catch {
    /* Optional preference */
  }
}
function onScroll() {
  const current = Math.max(0, window.scrollY)
  if (Math.abs(current - previousScroll) < 6 && current > 56) return
  headerHidden.value =
    current > 56 && current > previousScroll && !header.value?.contains(document.activeElement)
  previousScroll = current
}
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
watch(
  () => route.path,
  async () => {
    headerHidden.value = false
    previousScroll = 0
    await nextTick()
    document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true })
  },
)
</script>
<template>
  <a href="#main-content" class="skip-link">Skip to content</a>
  <header
    ref="header"
    class="topbar"
    :class="{ 'topbar-hidden': headerHidden }"
    @focusin="headerHidden = false"
  >
    <div class="topbar-inner">
      <RouterLink to="/candidatures" class="brand" aria-label="Folio home"
        ><span class="brand-mark"><Layers2 :size="18" /></span
        ><span class="brand-name">folio.</span></RouterLink
      >
      <span class="topbar-spacer" />
      <button
        class="icon-button theme-toggle"
        :aria-label="dark ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggleTheme"
      >
        <Sun v-if="dark" :size="18" /><Moon v-else :size="18" />
      </button>
      <span class="navbar-avatar" aria-label="Signed in as Your workspace">YW</span>
    </div>
  </header>
  <main id="main-content">
    <nav v-if="breadcrumbs.length > 1" class="breadcrumb" aria-label="Breadcrumb">
      <ol>
        <li v-for="(crumb, index) in breadcrumbs" :key="index">
          <ChevronRight v-if="index" :size="13" aria-hidden="true" />
          <RouterLink
            v-if="index < breadcrumbs.length - 1 && crumb.to"
            :to="crumb.to"
            :title="crumb.label"
            >{{ crumb.label }}</RouterLink
          >
          <span v-else aria-current="page" :title="crumb.label">{{ crumb.label }}</span>
        </li>
      </ol>
    </nav>
    <RouterView v-slot="{ Component }"
      ><Transition name="page" mode="out-in"><component :is="Component" /></Transition
    ></RouterView>
  </main>
  <Toaster
    :theme="dark ? 'dark' : 'light'"
    position="bottom-right"
    rich-colors
    close-button
    :duration="4000"
  />
</template>
