<script setup>
defineProps({
  quota: Object,
  loading: Boolean,
})
</script>

<template>
  <div
    v-if="loading || !quota"
    class="h-10 animate-pulse rounded-lg bg-zinc-800/60 px-4 py-2 text-xs text-zinc-500"
  >
    Carico quota…
  </div>

  <div
    v-else-if="quota.unlimited"
    class="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-200"
  >
    Admin · quota illimitata
  </div>

  <div
    v-else
    class="flex flex-wrap items-center gap-3 rounded-lg border border-laba-border bg-laba-surface px-4 py-2 text-xs text-zinc-200"
  >
    <span>
      Standard:
      <strong class="text-white">{{ quota.standard.used }}/{{ quota.standard.total }}</strong>
      (restano {{ quota.standard.remaining }})
    </span>
    <span class="text-zinc-600">|</span>
    <span>
      Hi‑res:
      <strong class="text-white">{{ quota.hires.used }}/{{ quota.hires.total }}</strong>
      (restano {{ quota.hires.remaining }})
    </span>
    <template v-if="quota.resetDate">
      <span class="text-zinc-600">|</span>
      <span class="text-zinc-500">Reset: {{ quota.resetDate }}</span>
    </template>
  </div>
</template>
