<script setup>
import { ref, watch } from "vue"
import { apiFetch, readJson } from "../lib/api.js"

const props = defineProps({
  open: Boolean,
})

const emit = defineEmits(["close"])

const users = ref([])
const stats = ref(null)
const loading = ref(false)
const error = ref(null)

async function load() {
  loading.value = true
  error.value = null
  const [u, s] = await Promise.all([apiFetch("/api/admin/users"), apiFetch("/api/admin/stats")])
  const uj = await readJson(u)
  const sj = await readJson(s)
  if (!u.ok) error.value = "Impossibile caricare utenti"
  else users.value = uj.users || []
  if (s.ok) stats.value = sj
  loading.value = false
}

watch(() => props.open, (val) => {
  if (val) load()
})

async function updateQuota(id, standard_monthly, hires_monthly) {
  const res = await apiFetch(`/api/admin/users/${id}/quota`, {
    method: "PUT",
    body: JSON.stringify({ standard_monthly, hires_monthly }),
  })
  if (res.ok) load()
}

async function resetMonth(id) {
  const res = await apiFetch(`/api/admin/users/${id}/reset`, { method: "POST" })
  if (res.ok) load()
}

function promptQuota(u) {
  const sm = window.prompt("Standard mensile", String(u.standard_monthly ?? 200))
  const hm = window.prompt("Hi‑res mensile", String(u.hires_monthly ?? 20))
  if (sm != null && hm != null) updateQuota(u.id, Number(sm), Number(hm))
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/70 p-4"
  >
    <div class="mt-8 w-full max-w-5xl rounded-2xl border border-laba-border bg-laba-bg p-6 shadow-2xl">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="font-display text-xl font-bold">Admin</h2>
        <button type="button" @click="emit('close')" class="text-sm text-zinc-400 hover:text-white">
          Chiudi
        </button>
      </div>

      <div v-if="stats" class="mb-4 grid gap-2 text-xs text-zinc-400 sm:grid-cols-3">
        <div class="rounded-lg border border-laba-border bg-laba-surface px-3 py-2">
          Utenti: <strong class="text-white">{{ stats.totalUsers }}</strong>
        </div>
        <div class="rounded-lg border border-laba-border bg-laba-surface px-3 py-2">
          Standard (mese): <strong class="text-white">{{ stats.standardUsedSum }}</strong>
        </div>
        <div class="rounded-lg border border-laba-border bg-laba-surface px-3 py-2">
          Hi‑res (mese): <strong class="text-white">{{ stats.hiresUsedSum }}</strong>
        </div>
      </div>

      <p v-if="loading" class="text-sm text-zinc-500">Caricamento…</p>
      <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr class="border-b border-laba-border text-zinc-500">
              <th class="py-2 pr-2">Email</th>
              <th class="py-2 pr-2">Ruolo</th>
              <th class="py-2 pr-2">Standard</th>
              <th class="py-2 pr-2">Hi‑res</th>
              <th class="py-2">Azioni</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id" class="border-b border-laba-border/60">
              <td class="py-2 pr-2 text-zinc-200">{{ u.email }}</td>
              <td class="py-2 pr-2">{{ u.role }}</td>
              <td class="py-2 pr-2">
                {{ u.standard_used ?? 0 }} / {{ u.standard_monthly ?? "—" }}
              </td>
              <td class="py-2 pr-2">
                {{ u.hires_used ?? 0 }} / {{ u.hires_monthly ?? "—" }}
              </td>
              <td class="py-2">
                <button
                  type="button"
                  class="mr-2 text-laba-accent hover:underline"
                  @click="promptQuota(u)"
                >
                  Quota
                </button>
                <button
                  type="button"
                  class="text-zinc-400 hover:underline"
                  @click="resetMonth(u.id)"
                >
                  Reset mese
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
