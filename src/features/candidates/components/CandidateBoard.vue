<script setup lang="ts">
import { ref } from 'vue'
import { GripVertical } from 'lucide-vue-next'
import { useCandidates } from '../stores/candidates'
import { initials, label } from '../utils/presentation'
import type { Candidate } from '../types'
const store = useCandidates()
const over = ref('')
function drag(event: DragEvent, candidate: Candidate) {
  event.dataTransfer?.setData('text/plain', String(candidate.id))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}
async function drop(event: DragEvent, status: string) {
  over.value = ''
  const candidate = store.items.find(
    (item) => item.id === Number(event.dataTransfer?.getData('text/plain')),
  )
  if (candidate && candidate.statut !== status) await store.update(candidate, { statut: status })
}
</script>
<template>
  <div class="board-hint">Current page · Drag cards or use their stage menu.</div>
  <div class="candidate-board">
    <section
      v-for="status in store.statuses"
      :key="status.id"
      class="board-column"
      :class="{ 'drag-over': over === status.nom }"
      :aria-label="label(status.nom)"
      @dragover.prevent="over = status.nom"
      @dragleave.self="over = ''"
      @drop.prevent="drop($event, status.nom)"
    >
      <h3>
        <span class="stage-dot" :style="{ background: status.couleur }" />{{ label(status.nom)
        }}<span class="count-pill">{{
          store.items.filter((item) => item.statut === status.nom).length
        }}</span>
      </h3>
      <div class="board-cards">
        <article
          v-for="candidate in store.items.filter((item) => item.statut === status.nom)"
          :key="candidate.id"
          class="board-card"
          :draggable="!store.pendingIds.has(candidate.id)"
          @dragstart="drag($event, candidate)"
          @dragend="over = ''"
        >
          <div class="flex justify-between items-center">
            <span class="avatar" :class="`avatar-${candidate.id % 5}`">{{
              initials(candidate.nom)
            }}</span
            ><GripVertical :size="17" class="muted" />
          </div>
          <RouterLink :to="`/candidatures/${candidate.id}`">{{ candidate.nom }}</RouterLink>
          <p>{{ label(candidate.poste) }}</p>
          <div class="skill-list">
            <span
              v-for="skill in candidate.competences.slice(0, 2)"
              :key="skill"
              class="skill-tag"
              >{{ skill }}</span
            >
          </div>
          <select
            :aria-label="`Stage for ${candidate.nom}`"
            :value="candidate.statut"
            :disabled="store.pendingIds.has(candidate.id)"
            @change="
              store.update(candidate, { statut: ($event.target as HTMLSelectElement).value })
            "
          >
            <option v-for="stage in store.statuses" :key="stage.id" :value="stage.nom">
              {{ label(stage.nom) }}
            </option>
          </select>
        </article>
        <p v-if="!store.items.some((item) => item.statut === status.nom)" class="empty-column">
          No candidates on this page
        </p>
      </div>
    </section>
  </div>
</template>
