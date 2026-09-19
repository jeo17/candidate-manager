<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Send,
  Trash2,
} from 'lucide-vue-next'
import { candidatesApi } from '../services/candidatesApi'
import { toast } from 'vue-sonner'
import { useCandidates } from '../stores/candidates'
import type { Candidate } from '../types'
import {
  currency,
  experienceLabel,
  formatDate,
  initials,
  label,
  safeWebUrl,
} from '../utils/presentation'
import { errorMessage } from '@/shared/api/http'
import { readStorage, writeStorage } from '@/shared/utils/storage'
import StatusBadge from './StatusBadge.vue'
import FeedbackState from '@/shared/components/FeedbackState.vue'
import ConfirmDialog from '@/shared/components/ConfirmDialog.vue'
const props = defineProps<{ id: number }>()
const store = useCandidates(),
  router = useRouter()
const candidate = ref<Candidate>(),
  loading = ref(true),
  error = ref(''),
  showDelete = ref(false)
const comment = ref(''),
  author = ref(readStorage<string>('folio:author', '')),
  commenting = ref(false)
const busy = computed(() => store.pendingIds.has(props.id))
async function load() {
  loading.value = true
  error.value = ''
  try {
    const [data] = await Promise.all([candidatesApi.detail(props.id), store.loadMetadata()])
    candidate.value = data
    store.activeCandidate = data
  } catch (cause) {
    error.value = errorMessage(cause)
  } finally {
    loading.value = false
  }
}
async function addComment() {
  if (!candidate.value || !comment.value.trim() || !author.value.trim()) return
  commenting.value = true
  writeStorage('folio:author', author.value.trim())
  // Re-read before appending to reduce overwriting another recruiter's comments.
  try {
    const fresh = await candidatesApi.detail(props.id)
    const next = {
      id: Math.max(0, ...fresh.commentaires.map((item) => item.id)) + 1,
      auteur: author.value.trim(),
      date: new Date().toISOString(),
      contenu: comment.value.trim(),
    }
    const saved = await store.update(candidate.value, {
      commentaires: [...fresh.commentaires, next],
    })
    if (saved) comment.value = ''
  } catch (cause) {
    toast.error(errorMessage(cause), { duration: Infinity })
  } finally {
    commenting.value = false
  }
}
async function remove() {
  const removed = await store.remove(props.id)
  showDelete.value = false
  if (removed) await router.replace('/candidatures')
}
onMounted(load)
</script>
<template>
  <div>
    <FeedbackState v-if="loading" loading /><FeedbackState
      v-else-if="error"
      :error="error"
      @retry="load"
    />
    <template v-else-if="candidate">
      <div class="detail-heading">
        <div class="flex items-center gap-5">
          <span class="avatar large" :class="`avatar-${candidate.id % 5}`">{{
            initials(candidate.nom)
          }}</span>
          <div>
            <h1 tabindex="-1">{{ candidate.nom }}</h1>
            <p>
              {{ label(candidate.poste) }} <span class="muted">· {{ candidate.localisation }}</span>
            </p>
          </div>
        </div>
        <div class="flex gap-2">
          <RouterLink :to="`/candidatures/${id}/modifier`" class="btn btn-secondary"
            ><Pencil :size="16" />Edit profile</RouterLink
          ><button
            class="icon-button danger-text"
            aria-label="Delete candidate"
            :disabled="busy"
            @click="showDelete = true"
          >
            <Trash2 :size="18" />
          </button>
        </div>
      </div>
      <div class="detail-layout">
        <div class="detail-main">
          <section class="surface detail-section">
            <div class="section-title">
              <h2>Profile</h2>
              <StatusBadge :status="candidate.statut" />
            </div>
            <div class="facts-grid">
              <div>
                <span><MapPin :size="16" />Location</span
                ><strong>{{ candidate.localisation || 'Not specified' }}</strong>
              </div>
              <div>
                <span><Clock3 :size="16" />Experience</span
                ><strong>{{ experienceLabel(candidate.experience) || 'Not specified' }}</strong>
              </div>
              <div>
                <span>€ &nbsp; Expected salary</span
                ><strong>{{ currency(candidate.salaireSouhaite) }} <small>/ year</small></strong>
              </div>
              <div>
                <span><CalendarDays :size="16" />Availability</span
                ><strong>{{ label(candidate.disponibilite) || 'Not specified' }}</strong>
              </div>
            </div>
            <div class="section-divider" />
            <h3>Skills</h3>
            <div class="skill-list mt-3">
              <span v-for="skill in candidate.competences" :key="skill" class="skill-tag">{{
                skill
              }}</span
              ><span v-if="!candidate.competences.length" class="muted">No skills added yet.</span>
            </div>
            <h3 class="cover-letter-heading">Cover letter</h3>
            <p class="cover-letter">
              {{ candidate.lettreMotivation || 'No cover letter provided.' }}
            </p>
            <a
              v-if="safeWebUrl(candidate.cv)"
              :href="safeWebUrl(candidate.cv)"
              target="_blank"
              rel="noopener noreferrer"
              class="document-link"
              ><span class="document-icon"><FileText :size="23" /></span
              ><span><strong>View résumé</strong></span
              ><ArrowUpRight :size="19"
            /></a>
          </section>
          <section class="surface detail-section">
            <div class="section-title">
              <h2>
                Team notes <span class="count-pill">{{ candidate.commentaires.length }}</span>
              </h2>
              <MessageSquare :size="19" class="muted" />
            </div>
            <div v-if="!candidate.commentaires.length" class="notes-empty">No notes yet.</div>
            <ol v-else class="comment-list">
              <li v-for="note in candidate.commentaires" :key="note.id">
                <span class="avatar avatar-2">{{ initials(note.auteur) }}</span>
                <div>
                  <div class="comment-meta">
                    <strong>{{ note.auteur }}</strong
                    ><time :datetime="note.date">{{ formatDate(note.date) }}</time>
                  </div>
                  <p>{{ note.contenu }}</p>
                </div>
              </li>
            </ol>
            <form class="comment-form" @submit.prevent="addComment">
              <label
                >Your name<input
                  v-model="author"
                  required
                  maxlength="100"
                  autocomplete="name"
                  placeholder="e.g. Alex Morgan" /></label
              ><label
                >Add a note<textarea
                  v-model="comment"
                  required
                  maxlength="3000"
                  rows="3"
                  placeholder="What should the team know?"
                />
              </label>
              <div class="flex justify-end">
                <button
                  class="btn btn-primary"
                  :disabled="busy || commenting || !comment.trim() || !author.trim()"
                >
                  <Send :size="15" />{{ commenting ? 'Adding note…' : 'Add note' }}
                </button>
              </div>
            </form>
          </section>
        </div>
        <aside class="detail-aside">
          <section class="surface detail-section">
            <h2>Hiring stage</h2>
            <label class="mt-5"
              >Current stage<select
                :value="candidate.statut"
                :disabled="busy || !!store.metadataError"
                @change="
                  store.update(candidate, { statut: ($event.target as HTMLSelectElement).value })
                "
              >
                <option v-for="status in store.statuses" :key="status.id" :value="status.nom">
                  {{ label(status.nom) }}
                </option>
              </select></label
            >
            <p v-if="busy" class="muted text-xs mt-2" role="status">Saving changes…</p>
            <p v-if="store.metadataError" class="inline-error">
              Stages unavailable. <button @click="store.loadMetadata(true)">Retry</button>
            </p>
            <div class="applied-note">
              <CalendarDays :size="16" /><span
                >Applied {{ formatDate(candidate.dateCandidature) }}</span
              >
            </div>
          </section>
          <section class="surface detail-section">
            <h2>Contact</h2>
            <a class="contact-link" :href="`mailto:${candidate.email}`"
              ><Mail :size="17" /><span>{{ candidate.email }}</span
              ><ArrowUpRight :size="15" /></a
            ><a
              v-if="candidate.telephone"
              class="contact-link"
              :href="`tel:${candidate.telephone.replace(/[^+\d]/g, '')}`"
              ><Phone :size="17" /><span>{{ candidate.telephone }}</span></a
            >
          </section>
        </aside>
      </div>
      <ConfirmDialog
        v-if="showDelete"
        title="Delete this candidate?"
        :description="`${candidate.nom}'s profile and team notes will be permanently removed. This cannot be undone.`"
        :busy="busy"
        @close="showDelete = false"
        @confirm="remove"
      />
    </template>
  </div>
</template>
