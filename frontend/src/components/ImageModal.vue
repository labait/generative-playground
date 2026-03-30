<script setup>
import { watch, onUnmounted } from "vue"

const props = defineProps({
  job: Object,
})

const emit = defineEmits(["close"])

function onKeydown(e) {
  if (e.key === "Escape") emit("close")
}

watch(
  () => props.job?.imageUrl,
  (val, oldVal) => {
    if (val && !oldVal) {
      window.addEventListener("keydown", onKeydown)
    } else if (!val && oldVal) {
      window.removeEventListener("keydown", onKeydown)
    }
  },
  { immediate: true }
)

onUnmounted(() => window.removeEventListener("keydown", onKeydown))
</script>

<template>
  <div
    v-if="job?.imageUrl"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6 sm:p-12"
    @click="emit('close')"
    role="presentation"
  >
    <img
      :src="job.imageUrl"
      :alt="job.prompt"
      class="max-h-[calc(100vh-6rem)] max-w-[calc(100vw-3rem)] sm:max-h-[calc(100vh-10rem)] sm:max-w-[calc(100vw-6rem)] object-contain rounded-lg"
      @click.stop
    />
    <div class="absolute right-4 top-4 flex gap-2">
      <a
        :href="job.imageUrl"
        :download="`laba-${job.jobId || 'image'}.webp`"
        @click.stop
        class="rounded-full bg-black/60 p-2 text-white hover:bg-black/80 backdrop-blur-sm"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </a>
      <button
        type="button"
        @click="emit('close')"
        class="rounded-full bg-black/60 p-2 text-white hover:bg-black/80 backdrop-blur-sm"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>
