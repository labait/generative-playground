<script setup>
defineProps({
  mode: String,
  disabled: Boolean,
})
const emit = defineEmits(["change"])
</script>

<template>
  <div class="inline-flex rounded-lg border border-laba-border bg-laba-bg p-1">
    <button
      type="button"
      :disabled="disabled"
      @click="emit('change', 'relax')"
      :class="[
        'rounded-md px-4 py-2 text-sm font-semibold transition',
        mode === 'relax'
          ? 'bg-laba-accent text-white shadow'
          : 'text-zinc-400 hover:text-zinc-200',
      ]"
    >
      Relax
      <span
        :class="[
          'ml-1.5 text-[10px] font-normal',
          mode === 'relax' ? 'text-violet-200' : 'text-zinc-600',
        ]"
        >Schnell</span
      >
    </button>
    <button
      type="button"
      :disabled="disabled"
      @click="emit('change', 'fast')"
      :class="[
        'rounded-md px-4 py-2 text-sm font-semibold transition',
        mode === 'fast'
          ? 'bg-laba-accent text-white shadow'
          : 'text-zinc-400 hover:text-zinc-200',
      ]"
    >
      Quality
      <span
        :class="[
          'ml-1.5 text-[10px] font-normal',
          mode === 'fast' ? 'text-violet-200' : 'text-zinc-600',
        ]"
        >Dev</span
      >
    </button>
  </div>
</template>
