<script setup>
const props = defineProps({
  aspectRatio: String,
  stylePreset: String,
  guidance: Number,
  seed: Number,
  negativePrompt: String,
  showAdvanced: Boolean,
  mode: String,
})

const emit = defineEmits([
  "update:aspectRatio",
  "update:stylePreset",
  "update:guidance",
  "update:seed",
  "update:negativePrompt",
  "toggleAdvanced",
])

const RATIOS = [
  { value: "1:1", label: "1:1", icon: "□" },
  { value: "3:2", label: "3:2", icon: "▬" },
  { value: "2:3", label: "2:3", icon: "▮" },
  { value: "16:9", label: "16:9", icon: "━" },
  { value: "9:16", label: "9:16", icon: "┃" },
  { value: "4:3", label: "4:3", icon: "▭" },
  { value: "3:4", label: "3:4", icon: "▯" },
]

const STYLES = [
  { value: "none", label: "Nessuno", desc: "Output naturale", color: "from-zinc-600 to-zinc-700" },
  { value: "photorealistic", label: "Foto", desc: "Fotorealistico", color: "from-blue-600 to-cyan-700" },
  { value: "cinematic", label: "Cinema", desc: "Cinematografico", color: "from-amber-700 to-orange-800" },
  { value: "illustration", label: "Illustrazione", desc: "Digitale", color: "from-pink-600 to-rose-700" },
  { value: "watercolor", label: "Acquerello", desc: "Pittura ad acqua", color: "from-teal-600 to-emerald-700" },
  { value: "oil-painting", label: "Olio", desc: "Pittura a olio", color: "from-yellow-700 to-amber-800" },
  { value: "anime", label: "Anime", desc: "Stile giapponese", color: "from-orange-500 to-amber-600" },
  { value: "3d-render", label: "3D", desc: "Render 3D", color: "from-indigo-600 to-blue-700" },
  { value: "pixel-art", label: "Pixel", desc: "Retro 8-bit", color: "from-green-600 to-lime-700" },
  { value: "sketch", label: "Schizzo", desc: "Matita su carta", color: "from-stone-500 to-stone-600" },
  { value: "minimal", label: "Minimal", desc: "Composizione pulita", color: "from-slate-500 to-slate-600" },
]
</script>

<template>
  <div class="space-y-5">
    <!-- Aspect Ratio -->
    <div>
      <span class="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Formato
      </span>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="r in RATIOS"
          :key="r.value"
          type="button"
          @click="emit('update:aspectRatio', r.value)"
          :class="[
            'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition',
            aspectRatio === r.value
              ? 'bg-laba-accent text-white shadow-md shadow-orange-900/30'
              : 'border border-laba-border bg-laba-bg/80 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200',
          ]"
        >
          <span class="text-[10px] opacity-60">{{ r.icon }}</span>
          {{ r.label }}
        </button>
      </div>
    </div>

    <!-- Style -->
    <div>
      <span class="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Stile
      </span>
      <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          v-for="s in STYLES"
          :key="s.value"
          type="button"
          @click="emit('update:stylePreset', s.value)"
          :class="[
            'flex-none rounded-xl px-4 py-2.5 text-left transition bg-gradient-to-br',
            s.color,
            stylePreset === s.value
              ? 'ring-2 ring-white/30 text-white shadow-lg'
              : 'opacity-40 text-white hover:opacity-70',
          ]"
        >
          <span class="block text-xs font-semibold">{{ s.label }}</span>
          <span class="block text-[10px] text-white/70">{{ s.desc }}</span>
        </button>
      </div>
    </div>

    <!-- Advanced toggle -->
    <button
      type="button"
      @click="emit('toggleAdvanced')"
      class="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition"
    >
      <svg
        :class="['h-3 w-3 transition-transform', showAdvanced ? 'rotate-90' : '']"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
      Impostazioni avanzate
    </button>

    <div
      v-if="showAdvanced"
      class="space-y-4 rounded-xl border border-laba-border/60 bg-laba-bg/40 p-4"
    >
      <label class="block text-sm">
        <span class="text-zinc-300">Negative prompt</span>
        <textarea
          :value="negativePrompt"
          @input="emit('update:negativePrompt', $event.target.value)"
          placeholder="Elementi da evitare nell'immagine…"
          rows="2"
          class="mt-1 w-full resize-none rounded-lg border border-laba-border bg-laba-bg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-laba-accent focus:outline-none focus:ring-1 focus:ring-laba-accent"
        />
      </label>
      <label v-if="mode === 'fast'" class="block text-sm">
        <div class="flex items-center justify-between">
          <span class="text-zinc-300">Guidance</span>
          <span class="text-xs font-mono text-zinc-500">{{ guidance }}</span>
        </div>
        <input
          type="range"
          :min="1"
          :max="10"
          :step="0.5"
          :value="guidance"
          @input="emit('update:guidance', Number($event.target.value))"
          class="mt-2 w-full accent-laba-accent"
        />
        <div class="flex justify-between text-[10px] text-zinc-600">
          <span>Creativo</span>
          <span>Fedele al prompt</span>
        </div>
      </label>
      <label class="block text-sm">
        <span class="text-zinc-300">Seed</span>
        <input
          type="number"
          :min="0"
          :value="seed || ''"
          @input="emit('update:seed', $event.target.value ? Number($event.target.value) : null)"
          placeholder="Casuale"
          class="mt-1 w-full rounded-lg border border-laba-border bg-laba-bg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-laba-accent focus:outline-none focus:ring-1 focus:ring-laba-accent"
        />
      </label>
    </div>
  </div>
</template>
