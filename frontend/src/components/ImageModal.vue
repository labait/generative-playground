<script setup>
import { computed, watch, onUnmounted } from "vue"

const STYLE_LABELS = {
  none: "Nessuno",
  photorealistic: "Foto",
  cinematic: "Cinema",
  illustration: "Illustrazione",
  watercolor: "Acquerello",
  "oil-painting": "Olio",
  anime: "Anime",
  "3d-render": "3D",
  "pixel-art": "Pixel",
  sketch: "Schizzo",
  minimal: "Minimal",
}

const props = defineProps({
  job: Object,
})

const emit = defineEmits(["close", "regenerate", "vary", "reuse", "upscale"])

const params = computed(() => props.job?.params || {})
const seed = computed(() => params.value.seed ?? null)
const style = computed(() => STYLE_LABELS[params.value.style] || params.value.style || "—")
const ratio = computed(() => params.value.aspect_ratio || "—")
const guidance = computed(() => params.value.guidance ?? "—")
const negPrompt = computed(() => params.value.negative_prompt || null)
const isUpscale = computed(() => props.job?.model === "upscale")
const isEdit = computed(() => props.job?.model === "edit")

function copySeed(e) {
  e.stopPropagation()
  if (seed.value != null) {
    navigator.clipboard.writeText(String(seed.value))
  }
}

function copyPrompt(e) {
  e.stopPropagation()
  navigator.clipboard.writeText(props.job?.prompt || "")
}

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
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8"
    @click="emit('close')"
    role="presentation"
  >
    <!-- Modal container -->
    <div
      class="flex max-h-[calc(100vh-2rem)] w-full max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl sm:max-h-[calc(100vh-4rem)] sm:flex-row"
      @click.stop
    >
      <!-- Image section -->
      <div class="relative flex min-h-0 flex-1 items-center justify-center bg-black p-2 sm:p-4">
        <img
          :src="job.imageUrl"
          :alt="job.prompt"
          class="h-full w-full object-contain sm:max-h-[calc(100vh-4rem)]"
        />
      </div>

      <!-- Info panel -->
      <div class="flex w-full flex-col border-t border-white/10 sm:w-72 sm:border-l sm:border-t-0 lg:w-80">
        <!-- Scrollable content -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-5">
          <!-- Prompt -->
          <div class="mb-4">
            <div class="mb-1.5 flex items-center justify-between">
              <span class="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Prompt</span>
              <button
                type="button"
                @click="copyPrompt"
                class="rounded px-1.5 py-0.5 text-[10px] text-zinc-500 transition hover:bg-white/10 hover:text-zinc-300"
              >
                Copia
              </button>
            </div>
            <p class="text-xs leading-relaxed text-zinc-200">{{ job.prompt }}</p>
          </div>

          <!-- Negative prompt -->
          <div v-if="negPrompt" class="mb-4">
            <span class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Negative prompt</span>
            <p class="text-xs leading-relaxed text-zinc-400">{{ negPrompt }}</p>
          </div>

          <!-- Params grid -->
          <div class="mb-4 grid grid-cols-2 gap-2.5">
            <div class="rounded-lg bg-white/5 px-3 py-2">
              <span class="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Modello</span>
              <span class="text-xs font-medium text-zinc-200">
                {{ job.model === "schnell" ? "Schnell" : job.model === "dev" ? "Dev" : job.model === "edit" ? "Modifica" : "Upscale" }}
              </span>
            </div>
            <div class="rounded-lg bg-white/5 px-3 py-2">
              <span class="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Formato</span>
              <span class="text-xs font-medium text-zinc-200">{{ ratio }}</span>
            </div>
            <div class="rounded-lg bg-white/5 px-3 py-2">
              <span class="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Stile</span>
              <span class="text-xs font-medium text-zinc-200">{{ style }}</span>
            </div>
            <div class="rounded-lg bg-white/5 px-3 py-2">
              <span class="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Guidance</span>
              <span class="text-xs font-medium text-zinc-200">{{ guidance }}</span>
            </div>
            <div class="col-span-2 rounded-lg bg-white/5 px-3 py-2">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Seed</span>
                <button
                  v-if="seed != null"
                  type="button"
                  @click="copySeed"
                  class="rounded px-1.5 py-0.5 text-[10px] text-zinc-500 transition hover:bg-white/10 hover:text-zinc-300"
                >
                  Copia
                </button>
              </div>
              <span class="font-mono text-xs font-medium text-zinc-200">
                {{ seed != null ? seed : "Casuale" }}
              </span>
            </div>
          </div>
        </div>

        <!-- Action buttons - fixed at bottom -->
        <div class="border-t border-white/10 p-4 sm:p-5">
          <div class="flex flex-col gap-2">
            <!-- Primary actions -->
            <div v-if="!isUpscale && !isEdit" class="flex gap-2">
              <button
                type="button"
                @click="emit('regenerate', job)"
                class="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-laba-accent px-3 py-2.5 text-xs font-semibold text-white shadow-md shadow-orange-900/30 transition hover:brightness-110"
                title="Rigenera l'immagine con gli stessi identici parametri e seed"
              >
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Rigenera identica
              </button>
              <button
                type="button"
                @click="emit('vary', job)"
                class="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-laba-border bg-white/5 px-3 py-2.5 text-xs font-medium text-zinc-200 transition hover:bg-white/10"
                title="Crea una variazione con gli stessi parametri ma seed diverso"
              >
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Variazione
              </button>
            </div>

            <!-- Secondary actions -->
            <div class="flex gap-2">
              <button
                v-if="!isUpscale && !isEdit"
                type="button"
                @click="emit('reuse', job)"
                class="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-laba-border bg-white/5 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/10"
                title="Carica tutti i parametri nel pannello di generazione per modificarli"
              >
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Riusa parametri
              </button>
              <button
                type="button"
                @click="emit('upscale', job.jobId)"
                class="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-laba-border bg-white/5 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/10"
              >
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Upscale
              </button>
            </div>

            <!-- Download -->
            <a
              :href="job.imageUrl"
              :download="`laba-${job.jobId || 'image'}.webp`"
              @click.stop
              class="flex items-center justify-center gap-1.5 rounded-lg border border-laba-border bg-white/5 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/10"
            >
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Scarica
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Close button -->
    <button
      type="button"
      @click="emit('close')"
      class="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm transition hover:bg-black/80"
    >
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>
