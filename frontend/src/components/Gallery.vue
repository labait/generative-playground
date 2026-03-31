<script setup>
import ImageCard from "./ImageCard.vue"

defineProps({
  jobs: Array,
})

const emit = defineEmits(["upscale", "vary", "regenerate", "open", "delete"])
</script>

<template>
  <div
    v-if="!jobs.length"
    class="rounded-2xl border border-dashed border-laba-border bg-laba-surface/40 p-12 text-center text-sm text-zinc-500"
  >
    Nessuna immagine ancora. Scrivi un prompt e premi Genera.
  </div>
  <div v-else class="columns-1 gap-4 sm:columns-2 lg:columns-3">
    <ImageCard
      v-for="job in jobs"
      :key="job.jobId"
      :job="job"
      class="mb-4 break-inside-avoid"
      @upscale="emit('upscale', $event)"
      @vary="emit('vary', $event)"
      @regenerate="emit('regenerate', $event)"
      @open="emit('open', $event)"
      @delete="emit('delete', $event)"
    />
  </div>
</template>
