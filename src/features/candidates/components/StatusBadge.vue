<script setup lang="ts">
import { computed } from 'vue'
import { label } from '../utils/presentation'
const props = defineProps<{ status: string }>()
const tone = computed(
  () =>
    ({
      'En attente': 'neutral',
      'Entretien RH': 'blue',
      'Entretien technique': 'amber',
      Accepté: 'green',
      Refusé: 'rose',
    })[props.status] || 'neutral',
)
</script>
<template>
  <span class="status-badge" :class="`status-${tone}`"
    ><span class="status-dot" />{{ label(status) }}</span
  >
</template>
