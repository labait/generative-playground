<script setup>
import { ref, computed } from "vue"
import ModeToggle from "./ModeToggle.vue"
import ParamBar from "./ParamBar.vue"

const props = defineProps({
  busy: Boolean,
})

const emit = defineEmits(["generate", "edit"])

// Generate tab state
const prompt = ref("")
const negativePrompt = ref("")
const mode = ref("relax")
const aspectRatio = ref("1:1")
const stylePreset = ref("none")
const guidance = ref(3.5)
const seed = ref(null)
const showAdvanced = ref(false)

// Tab
const activeTab = ref("generate")

// Edit tab state
const editFile = ref(null)
const editPreviewUrl = ref(null)
const editPrompt = ref("")
const editAspectRatio = ref("1:1")
const fileInput = ref(null)

const editReady = computed(() => editFile.value && editPrompt.value.trim())

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

function setEditFile(file) {
  if (!file || !file.type.startsWith("image/")) return
  editFile.value = file
  if (editPreviewUrl.value) URL.revokeObjectURL(editPreviewUrl.value)
  editPreviewUrl.value = URL.createObjectURL(file)
}

function onFileChange(e) {
  setEditFile(e.target.files?.[0])
}

function onDrop(e) {
  e.preventDefault()
  setEditFile(e.dataTransfer.files?.[0])
}

function clearEditFile() {
  editFile.value = null
  if (editPreviewUrl.value) {
    URL.revokeObjectURL(editPreviewUrl.value)
    editPreviewUrl.value = null
  }
  if (fileInput.value) fileInput.value.value = ""
}

function submitEdit() {
  if (!editReady.value || props.busy) return
  emit("edit", {
    file: editFile.value,
    prompt: editPrompt.value,
    aspect_ratio: editAspectRatio.value,
  })
}
</script>

<template>
  <div class="rounded-2xl border border-laba-border bg-laba-surface/80 p-5 shadow-xl backdrop-blur sm:p-6">

    <!-- Tab bar -->
    <div class="mb-5 flex gap-1 rounded-lg border border-laba-border bg-laba-bg p-1 w-fit">
      <button
        type="button"
        @click="activeTab = 'generate'"
        :disabled="busy"
        :class="[
          'rounded-md px-4 py-2 text-sm font-semibold transition',
          activeTab === 'generate' ? 'bg-laba-accent text-white shadow' : 'text-zinc-400 hover:text-zinc-200',
        ]"
      >Genera</button>
      <button
        type="button"
        @click="activeTab = 'edit'"
        :disabled="busy"
        :class="[
          'rounded-md px-4 py-2 text-sm font-semibold transition',
          activeTab === 'edit' ? 'bg-laba-accent text-white shadow' : 'text-zinc-400 hover:text-zinc-200',
        ]"
      >Modifica foto</button>
    </div>

    <!-- GENERATE TAB -->
    <template v-if="activeTab === 'generate'">
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
          class="ml-auto rounded-xl bg-laba-accent px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-900/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {{ busy ? "Generazione…" : "Genera" }}
        </button>
      </div>
    </template>

    <!-- EDIT TAB -->
    <template v-else>
      <h2 class="mb-4 font-display text-lg font-bold text-white">Modifica immagine</h2>

      <!-- Drop zone -->
      <div
        v-if="!editPreviewUrl"
        class="mb-4 flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-laba-border bg-laba-bg text-zinc-500 transition hover:border-laba-accent hover:text-zinc-300"
        @dragover.prevent
        @drop="onDrop"
        @click="fileInput.click()"
      >
        <svg class="h-8 w-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <span class="text-sm">Carica o trascina un'immagine</span>
        <span class="text-xs">PNG, JPG, WEBP · max 10 MB</span>
      </div>

      <!-- Preview -->
      <div v-else class="relative mb-4">
        <img :src="editPreviewUrl" alt="Anteprima" class="max-h-60 w-full rounded-xl object-contain bg-zinc-900" />
        <button
          type="button"
          @click="clearEditFile"
          class="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm hover:bg-black/80"
          title="Rimuovi immagine"
        >
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onFileChange"
      />

      <!-- Edit instruction -->
      <textarea
        v-model="editPrompt"
        placeholder="Descrivi come modificare l'immagine… (es. rendi il cielo rosa al tramonto)"
        rows="3"
        class="mb-4 w-full resize-none rounded-xl border border-laba-border bg-laba-bg px-4 py-3 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-500 focus:border-laba-accent focus:outline-none focus:ring-1 focus:ring-laba-accent"
      />

      <!-- Output aspect ratio -->
      <div class="mb-5">
        <span class="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Formato output</span>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="r in ['1:1', '3:2', '2:3', '16:9', '9:16', '4:3', '3:4']"
            :key="r"
            type="button"
            @click="editAspectRatio = r"
            :class="[
              'rounded-lg px-3 py-2 text-xs font-medium transition',
              editAspectRatio === r
                ? 'bg-laba-accent text-white shadow-md shadow-violet-900/30'
                : 'border border-laba-border bg-laba-bg/80 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200',
            ]"
          >{{ r }}</button>
        </div>
      </div>

      <div class="flex justify-end">
        <button
          type="button"
          :disabled="busy || !editReady"
          @click="submitEdit"
          class="rounded-xl bg-laba-accent px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {{ busy ? "Modifica in corso…" : "Modifica" }}
        </button>
      </div>
    </template>

  </div>
</template>
