<script setup>
import { ref } from "vue"
import { useAuth } from "./composables/useAuth.js"
import { useGenerate } from "./composables/useGenerate.js"
import { useQuota } from "./composables/useQuota.js"
import PromptBox from "./components/PromptBox.vue"
import Gallery from "./components/Gallery.vue"
import QuotaBar from "./components/QuotaBar.vue"
import ImageModal from "./components/ImageModal.vue"
import AdminPanel from "./components/AdminPanel.vue"

const { user, loading, login, logout } = useAuth()
const { quota, loading: quotaLoading, refresh: refreshQuota } = useQuota(() => !!user.value)
const { jobs, generateImage, upscaleJob, editImage, deleteJob } = useGenerate(refreshQuota)

const promptBoxRef = ref(null)
const busy = ref(false)
const modalJob = ref(null)
const adminOpen = ref(false)
const banner = ref(null)

async function onGenerate(params) {
  busy.value = true
  banner.value = null
  try {
    await generateImage(params)
  } catch (e) {
    banner.value = e.message === "quota_exceeded" ? "Quota mensile superata." : e.message === "replicate_rate_limited" ? "Troppe richieste simultanee, riprova tra qualche secondo." : "Generazione non riuscita."
  } finally {
    busy.value = false
  }
}

async function onEdit({ file, prompt, aspect_ratio }) {
  busy.value = true
  banner.value = null
  try {
    await editImage(file, prompt, aspect_ratio)
  } catch (e) {
    banner.value = e.message === "quota_exceeded" ? "Quota mensile superata." : e.message === "replicate_rate_limited" ? "Troppe richieste simultanee, riprova tra qualche secondo." : "Modifica non riuscita."
  } finally {
    busy.value = false
  }
}

async function onUpscale(jobId) {
  busy.value = true
  banner.value = null
  modalJob.value = null
  try {
    await upscaleJob(jobId)
  } catch (e) {
    banner.value = e.message === "quota_exceeded" ? "Quota mensile superata." : e.message === "replicate_rate_limited" ? "Troppe richieste simultanee, riprova tra qualche secondo." : "Upscale non riuscito."
  } finally {
    busy.value = false
  }
}

async function onVary(job) {
  if (job.model === "upscale" || job.model === "edit") return
  const base = job.params || {}
  const p = base.prompt || job.prompt
  busy.value = true
  banner.value = null
  modalJob.value = null
  try {
    await generateImage({
      ...base,
      prompt: `${p}, variante ${Date.now()}`,
      model: job.model,
      seed: null,
    })
  } catch (e) {
    banner.value = e.message === "quota_exceeded" ? "Quota mensile superata." : e.message === "replicate_rate_limited" ? "Troppe richieste simultanee, riprova tra qualche secondo." : "Variazione non riuscita."
  } finally {
    busy.value = false
  }
}

async function onRegenerate(job) {
  if (job.model === "upscale" || job.model === "edit") return
  const base = job.params || {}
  const p = base.prompt || job.prompt
  busy.value = true
  banner.value = null
  modalJob.value = null
  try {
    await generateImage({
      ...base,
      prompt: p,
      model: job.model,
    })
  } catch (e) {
    banner.value = e.message === "quota_exceeded" ? "Quota mensile superata." : e.message === "replicate_rate_limited" ? "Troppe richieste simultanee, riprova tra qualche secondo." : "Rigenerazione non riuscita."
  } finally {
    busy.value = false
  }
}

function onReuse(job) {
  if (job.model === "upscale" || job.model === "edit") return
  const base = job.params || {}
  promptBoxRef.value?.loadParams({
    prompt: base.prompt || job.prompt,
    negative_prompt: base.negative_prompt || "",
    aspect_ratio: base.aspect_ratio,
    style: base.style,
    guidance: base.guidance,
    seed: base.seed,
    model: job.model,
  })
  modalJob.value = null
  window.scrollTo({ top: 0, behavior: "smooth" })
}
</script>

<template>
  <!-- Loading state -->
  <div v-if="loading" class="flex min-h-screen items-center justify-center text-zinc-500">
    Caricamento…
  </div>

  <!-- Login screen -->
  <div v-else-if="!user" class="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
    <div class="text-center">
      <img src="/laba-logo.svg" alt="LABA" class="mx-auto mb-4 h-12 w-auto" />
      <p class="mt-1 max-w-md text-sm text-zinc-400">
        Generazione immagini per studenti LABA. Accedi con il tuo account Microsoft istituzionale.
      </p>
    </div>
    <button
      type="button"
      @click="login"
      class="rounded-xl bg-laba-accent px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-900/40 hover:brightness-110"
    >
      Accedi con Microsoft
    </button>
  </div>

  <!-- Main app -->
  <div v-else class="min-h-screen">
    <header class="sticky top-0 z-30 border-b border-laba-border bg-laba-bg/90 backdrop-blur">
      <div class="mx-auto flex max-w-full flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <img src="/laba-logo.svg" alt="LABA" class="mb-0.5 h-7 w-auto" />
          <p class="text-xs text-zinc-400">
            {{ user.displayName || user.email }} · {{ user.role }}
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <QuotaBar :quota="quota" :loading="quotaLoading" />
          <button
            v-if="user.role === 'admin'"
            type="button"
            @click="adminOpen = true"
            class="rounded-lg border border-laba-border px-3 py-2 text-xs text-zinc-300 hover:bg-laba-surface"
          >
            Admin
          </button>
          <button
            type="button"
            @click="logout"
            class="rounded-lg border border-laba-border px-3 py-2 text-xs text-zinc-400 hover:text-white"
          >
            Esci
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-full space-y-8 px-4 py-8">
      <div
        v-if="banner"
        class="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
      >
        {{ banner }}
      </div>
      <div class="mx-auto max-w-[1280px]">
        <PromptBox ref="promptBoxRef" :busy="busy" @generate="onGenerate" @edit="onEdit" />
      </div>
      <section>
        <h2 class="mb-4 font-display text-lg font-semibold text-white">Galleria</h2>
        <Gallery
          :jobs="jobs"
          @upscale="onUpscale"
          @vary="onVary"
          @regenerate="onRegenerate"
          @open="modalJob = $event"
          @delete="deleteJob"
        />
      </section>
    </main>

    <ImageModal
      :job="modalJob"
      @close="modalJob = null"
      @regenerate="onRegenerate"
      @vary="onVary"
      @reuse="onReuse"
      @upscale="onUpscale"
    />
    <AdminPanel :open="adminOpen" @close="adminOpen = false" />
  </div>
</template>
