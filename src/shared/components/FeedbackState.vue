<script setup lang="ts">
import { CircleAlert, LoaderCircle, SearchX } from 'lucide-vue-next'
defineProps<{ loading?: boolean; error?: string; title?: string; description?: string }>()
defineEmits<{ retry: [] }>()
</script>
<template>
  <div class="feedback-state" :role="error ? 'alert' : 'status'">
    <LoaderCircle v-if="loading" class="animate-spin" :size="28" />
    <CircleAlert v-else-if="error" :size="30" />
    <SearchX v-else :size="30" />
    <h3>{{ loading ? 'Loading candidates…' : error ? 'Unable to load this content' : title }}</h3>
    <p>{{ error || description }}</p>
    <button v-if="error" class="btn btn-secondary" @click="$emit('retry')">Try again</button>
    <slot />
  </div>
</template>
