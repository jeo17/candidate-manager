<script setup lang="ts">
import CandidateEditor from '@/features/candidates/components/CandidateEditor.vue'
defineProps<{ id?: string }>()
</script>
<template><CandidateEditor :key="id || 'new'" :id="id ? Number(id) : undefined" /></template>
