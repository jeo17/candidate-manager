<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next'
import { useCandidates } from '../stores/candidates'
import { experienceLabel, formatDate, initials, label } from '../utils/presentation'
import StatusBadge from './StatusBadge.vue'
const store = useCandidates()
</script>
<template>
  <div class="table-scroll">
    <table class="candidate-table">
      <caption class="sr-only">
        Candidates matching your filters
      </caption>
      <thead>
        <tr>
          <th scope="col">Candidate</th>
          <th scope="col">Position</th>
          <th scope="col">Stage</th>
          <th scope="col">Skills</th>
          <th scope="col">Applied</th>
          <th scope="col"><span class="sr-only">Open profile</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="candidate in store.items" :key="candidate.id">
          <td>
            <RouterLink :to="`/candidatures/${candidate.id}`" class="candidate-identity"
              ><span class="avatar" :class="`avatar-${candidate.id % 5}`">{{
                initials(candidate.nom)
              }}</span
              ><span
                ><strong>{{ candidate.nom }}</strong
                ><small>{{ candidate.email }}</small></span
              ></RouterLink
            >
          </td>
          <td>
            <span class="position-name">{{ label(candidate.poste) }}</span
            ><small class="table-secondary"
              >{{ experienceLabel(candidate.experience) }} experience</small
            >
          </td>
          <td><StatusBadge :status="candidate.statut" /></td>
          <td>
            <div class="skill-list">
              <span
                v-for="skill in candidate.competences.slice(0, 2)"
                :key="skill"
                class="skill-tag"
                >{{ skill }}</span
              ><span
                v-if="candidate.competences.length > 2"
                class="more-skills"
                :title="candidate.competences.slice(2).join(', ')"
                >+{{ candidate.competences.length - 2 }}</span
              >
            </div>
          </td>
          <td class="date-cell">{{ formatDate(candidate.dateCandidature) }}</td>
          <td>
            <RouterLink
              :to="`/candidatures/${candidate.id}`"
              class="row-open"
              :aria-label="`View ${candidate.nom}`"
              ><ArrowUpRight :size="18"
            /></RouterLink>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
