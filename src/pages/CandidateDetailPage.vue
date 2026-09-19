<script setup lang="ts">
import CandidateDetail from '@/features/candidates/components/CandidateDetail.vue'
defineProps<{ id: string }>()
</script>
<template><CandidateDetail :key="id" :id="Number(id)" /></template>
