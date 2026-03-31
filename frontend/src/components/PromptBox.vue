<script setup>
import { ref } from "vue"
import ModeToggle from "./ModeToggle.vue"
import ParamBar from "./ParamBar.vue"

const props = defineProps({
  busy: Boolean,
})

const emit = defineEmits(["generate"])

const prompt = ref("")
const negativePrompt = ref("")
const mode = ref("relax")
const aspectRatio = ref("1:1")
const stylePreset = ref("none")
const guidance = ref(3.5)
const seed = ref(null)
const showAdvanced = ref(false)

function submit() {
  const model = mode.value === "fast" ? "dev" : "schnell"
  emit("generate", {
    prompt: prompt.value,
    negative_prompt: negativePrompt.value,
    model,
    aspect_ratio: aspectRatio.value,
    style: stylePreset.value,
    guidance: guidance.value,
    seed: seed.value,
  })
}

function loadParams(params) {
  if (params.prompt != null) prompt.value = params.prompt
  if (params.negative_prompt != null) negativePrompt.value = params.negative_prompt
  if (params.aspect_ratio) aspectRatio.value = params.aspect_ratio
  if (params.style) stylePreset.value = params.style
  if (params.guidance != null) guidance.value = params.guidance
  if (params.seed !== undefined) seed.value = params.seed
  if (params.model) {
    mode.value = params.model === "dev" ? "fast" : "relax"
  }
  if (params.negative_prompt || params.seed != null || params.guidance != null) {
    showAdvanced.value = true
  }
}

defineExpose({ loadParams })

function onKeyDown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault()
    if (!props.busy && prompt.value.trim()) submit()
  }
}
</script>

<template>
  <div class="rounded-2xl border border-laba-border bg-laba-surface/80 p-5 shadow-xl backdrop-blur sm:p-6">
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="font-display text-lg font-bold text-white">Crea immagine</h2>
      <ModeToggle :mode="mode" @change="mode = $event" :disabled="busy" />
    </div>

    <textarea
      v-model="prompt"
      @keydown="onKeyDown"
      placeholder="Descrivi l'immagine che vuoi creare…"
      rows="3"
      class="mb-4 w-full resize-none rounded-xl border border-laba-border bg-laba-bg px-4 py-3 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-500 focus:border-laba-accent focus:outline-none focus:ring-1 focus:ring-laba-accent"
    />

    <ParamBar
      :aspect-ratio="aspectRatio"
      @update:aspect-ratio="aspectRatio = $event"
      :style-preset="stylePreset"
      @update:style-preset="stylePreset = $event"
      :guidance="guidance"
      @update:guidance="guidance = $event"
      :seed="seed"
      @update:seed="seed = $event"
      :negative-prompt="negativePrompt"
      @update:negative-prompt="negativePrompt = $event"
      :show-advanced="showAdvanced"
      @toggle-advanced="showAdvanced = !showAdvanced"
      :mode="mode"
    />

    <div class="mt-5 flex items-center justify-between gap-3">
      <p class="hidden text-xs text-zinc-500 sm:block">
        <kbd class="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
          ⌘ Enter
        </kbd>
        per generare
      </p>
      <button
        type="button"
        :disabled="busy || !prompt.trim()"
        @click="submit"
        class="ml-auto rounded-xl bg-laba-accent px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {{ busy ? "Generazione…" : "Genera" }}
      </button>
    </div>
  </div>
</template>
