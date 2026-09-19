<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
defineProps<{ title: string; description: string; busy?: boolean }>()
const emit = defineEmits<{ confirm: []; close: [] }>()
const dialog = ref<HTMLDialogElement>()
let previousFocus: HTMLElement | null = null
onMounted(() => {
  previousFocus = document.activeElement as HTMLElement
  dialog.value?.showModal()
})
onUnmounted(() => previousFocus?.focus())
</script>
<template>
  <dialog
    ref="dialog"
    class="confirm-dialog"
    aria-labelledby="confirm-title"
    aria-describedby="confirm-description"
    @cancel.prevent="!busy && emit('close')"
  >
    <h2 id="confirm-title">{{ title }}</h2>
    <p id="confirm-description">{{ description }}</p>
    <div class="flex justify-end gap-3 mt-6">
      <button autofocus class="btn btn-secondary" :disabled="busy" @click="emit('close')">
        Cancel
      </button>
      <button class="btn btn-danger" :disabled="busy" @click="emit('confirm')">
        {{ busy ? 'Deleting…' : 'Delete candidate' }}
      </button>
    </div>
  </dialog>
</template>
