<script setup>
import { computed } from "vue"

const props = defineProps({
  job: Object,
})

const emit = defineEmits(["upscale", "vary", "open", "delete"])

const busy = computed(() => props.job.status === "pending" || props.job.status === "processing")

function copyPrompt(e) {
  e.stopPropagation()
  navigator.clipboard.writeText(props.job.prompt || "")
}

function download(e) {
  e.stopPropagation()
  if (!props.job.imageUrl) return
  const a = document.createElement("a")
  a.href = props.job.imageUrl
  a.download = `laba-${props.job.jobId}.webp`
  a.click()
}

function confirmDelete(e) {
  e.stopPropagation()
  if (window.confirm("Eliminare questa immagine definitivamente?")) {
    emit("delete", props.job.jobId)
  }
}
</script>

<template>
  <div class="group relative overflow-hidden rounded-xl border border-laba-border bg-laba-surface">
    <div class="aspect-square w-full overflow-hidden bg-zinc-900">
      <div v-if="busy" class="flex h-full w-full flex-col items-center justify-center gap-3">
        <div class="h-10 w-10 animate-spin rounded-full border-2 border-laba-accent border-t-transparent" />
        <div class="h-2 w-3/4 animate-shimmer rounded-full" />
        <p class="text-xs text-zinc-400">
          {{ job.status === "pending" ? "In coda…" : "Generazione…" }}
        </p>
      </div>
      <div
        v-else-if="job.status === 'failed'"
        class="flex h-full items-center justify-center p-4 text-center text-sm text-red-300"
      >
        {{ job.error || "Errore" }}
      </div>
      <button
        v-else-if="job.status === 'succeeded' && job.imageUrl"
        type="button"
        @click="emit('open', job)"
        class="block h-full w-full"
      >
        <img
          :src="job.imageUrl"
          alt=""
          class="h-full w-full object-cover transition group-hover:scale-[1.02]"
        />
      </button>
    </div>

    <!-- Hover overlay with actions -->
    <div
      class="pointer-events-none absolute inset-0 cursor-pointer bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"
      @click="emit('open', job)"
      role="presentation"
    >
      <div class="absolute bottom-0 left-0 right-0 p-3" @click.stop>
        <p class="line-clamp-2 text-xs leading-relaxed text-zinc-100">{{ job.prompt }}</p>
        <div v-if="job.status === 'succeeded'" class="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            @click="download"
            class="pointer-events-auto rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm hover:bg-white/25"
          >
            Scarica
          </button>
          <button
            type="button"
            @click="copyPrompt"
            class="pointer-events-auto rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm hover:bg-white/25"
          >
            Copia prompt
          </button>
          <button
            type="button"
            @click.stop="emit('upscale', job.jobId)"
            class="pointer-events-auto rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm hover:bg-white/25"
          >
            Upscale
          </button>
          <button
            v-if="job.model !== 'upscale'"
            type="button"
            @click.stop="emit('vary', job)"
            class="pointer-events-auto rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm hover:bg-white/25"
          >
            Variazione
          </button>
        </div>
      </div>
    </div>

    <!-- Always-visible action buttons -->
    <div v-if="job.status === 'succeeded'" class="absolute right-2 top-2 flex gap-1.5">
      <a
        :href="job.imageUrl"
        :download="`laba-${job.jobId}.webp`"
        @click.stop
        class="pointer-events-auto rounded-md bg-black/60 p-1.5 text-zinc-300 backdrop-blur-sm transition hover:bg-white/20 hover:text-white"
      >
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </a>
      <button
        type="button"
        @click="confirmDelete"
        class="pointer-events-auto rounded-md bg-black/60 p-1.5 text-zinc-300 backdrop-blur-sm transition hover:bg-red-600/80 hover:text-white"
      >
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>

    <!-- Model badge -->
    <div
      v-if="job.model && job.status === 'succeeded'"
      class="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-zinc-300 backdrop-blur-sm"
    >
      {{ job.model === "schnell" ? "Schnell" : job.model === "dev" ? "Dev" : "Upscale" }}
    </div>
  </div>
</template>
