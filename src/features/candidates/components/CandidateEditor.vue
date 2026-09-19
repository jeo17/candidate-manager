<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { Check } from 'lucide-vue-next'
import { useCandidates } from '../stores/candidates'
import { candidatesApi } from '../services/candidatesApi'
import type { Candidate, CandidateInput } from '../types'
import { label } from '../utils/presentation'
import { validateCandidate, type CandidateValidationErrors } from '../validation/candidateSchema'
import { errorMessage } from '@/shared/api/http'
import FeedbackState from '@/shared/components/FeedbackState.vue'
const props = defineProps<{ id?: number }>()
const store = useCandidates(),
  router = useRouter()
const loading = ref(true),
  error = ref(''),
  saving = ref(false),
  validation = ref(''),
  validationErrors = ref<CandidateValidationErrors>({}),
  skillsText = ref(''),
  date = ref('')
const original = ref<Candidate>(),
  baseline = ref(''),
  saved = ref(false)
const form = reactive<CandidateInput>({
  nom: '',
  email: '',
  telephone: '',
  poste: '',
  statut: '',
  competences: [],
  experience: '',
  dateCandidature: '',
  cv: '',
  lettreMotivation: '',
  salaireSouhaite: 0,
  disponibilite: '',
  localisation: '',
  commentaires: [],
})
const snapshot = () => JSON.stringify([form, skillsText.value, date.value])
function clearValidation(field: keyof CandidateInput) {
  delete validationErrors.value[field]
  if (!Object.keys(validationErrors.value).length) validation.value = ''
}
async function load() {
  loading.value = true
  error.value = ''
  try {
    await store.loadMetadata()
    if (store.metadataError) {
      error.value = store.metadataError
      return
    }
    if (props.id) {
      original.value = await candidatesApi.detail(props.id)
      store.activeCandidate = original.value
      const { id: _id, ...data } = original.value
      Object.assign(form, data)
    } else {
      form.statut = store.statuses[0]?.nom || ''
      form.dateCandidature = new Date().toISOString()
    }
    skillsText.value = form.competences.join(', ')
    date.value = form.dateCandidature.slice(0, 10)
    baseline.value = snapshot()
  } catch (cause) {
    error.value = errorMessage(cause)
  } finally {
    loading.value = false
  }
}
async function submit() {
  validation.value = ''
  validationErrors.value = {}
  const draft: CandidateInput = {
    ...form,
    nom: form.nom.trim(),
    email: form.email.trim(),
    competences: [
      ...new Set(
        skillsText.value
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
      ),
    ],
    dateCandidature: !date.value
      ? ''
      : date.value === original.value?.dateCandidature.slice(0, 10)
        ? original.value.dateCandidature
        : `${date.value}T12:00:00.000Z`,
  }
  const checked = validateCandidate(draft)
  const fieldErrors: CandidateValidationErrors = checked.success ? {} : checked.errors
  if (draft.poste && !store.positions.some((position) => position.titre === draft.poste))
    fieldErrors.poste = 'Select a position from the list.'
  if (draft.statut && !store.statuses.some((status) => status.nom === draft.statut))
    fieldErrors.statut = 'Select a hiring stage from the list.'
  if (Object.keys(fieldErrors).length) {
    validationErrors.value = fieldErrors
    validation.value = 'Review the highlighted fields and try again.'
    await nextTick()
    document.querySelector<HTMLElement>('.candidate-form [aria-invalid="true"]')?.focus()
    return
  }
  const input = checked.success ? checked.data : draft
  saving.value = true
  // Editing profile fields must not overwrite notes added since this form opened.
  const { commentaires: _comments, ...profilePatch } = input
  const result = original.value
    ? await store.update(original.value, profilePatch)
    : await store.create(input)
  saving.value = false
  if (result) {
    saved.value = true
    await router.push(original.value ? `/candidatures/${result.id}` : '/candidatures')
  }
}
onBeforeRouteLeave(() => {
  if (!saved.value && baseline.value && snapshot() !== baseline.value)
    return window.confirm('You have unsaved changes. Leave this page?')
})
onMounted(load)
</script>
<template>
  <div class="editor-page">
    <div class="page-heading">
      <div>
        <h1 tabindex="-1">{{ id ? 'Edit candidate' : 'Add candidate' }}</h1>
      </div>
    </div>
    <FeedbackState v-if="loading" loading /><FeedbackState
      v-else-if="error"
      :error="error"
      @retry="load"
    />
    <form v-else class="surface candidate-form" novalidate @submit.prevent="submit">
      <div class="form-section-heading">
        <div>
          <p>Fields marked with * are required.</p>
        </div>
      </div>
      <div v-if="validation" class="inline-error" role="alert">{{ validation }}</div>
      <fieldset :disabled="saving">
        <div class="form-grid">
          <label :class="{ 'field-invalid': validationErrors.nom }"
            >Full name *<input
              v-model="form.nom"
              name="name"
              autocomplete="name"
              required
              maxlength="120"
              placeholder="e.g. Alex Morgan"
              :aria-invalid="!!validationErrors.nom"
              aria-describedby="name-error"
              @input="clearValidation('nom')"
            /><small v-if="validationErrors.nom" id="name-error" class="field-error">{{
              validationErrors.nom
            }}</small></label
          ><label :class="{ 'field-invalid': validationErrors.email }"
            >Email address *<input
              v-model="form.email"
              name="email"
              type="email"
              autocomplete="email"
              required
              maxlength="200"
              placeholder="alex@example.com"
              :aria-invalid="!!validationErrors.email"
              aria-describedby="email-error"
              @input="clearValidation('email')"
            /><small v-if="validationErrors.email" id="email-error" class="field-error">{{
              validationErrors.email
            }}</small></label
          ><label :class="{ 'field-invalid': validationErrors.telephone }"
            >Phone number<input
              v-model="form.telephone"
              name="phone"
              type="tel"
              autocomplete="tel"
              maxlength="40"
              placeholder="+33 6 12 34 56 78"
              :aria-invalid="!!validationErrors.telephone"
              aria-describedby="phone-error"
              @input="clearValidation('telephone')"
            /><small v-if="validationErrors.telephone" id="phone-error" class="field-error">{{
              validationErrors.telephone
            }}</small></label
          ><label :class="{ 'field-invalid': validationErrors.localisation }"
            >Location<input
              v-model="form.localisation"
              name="location"
              maxlength="120"
              placeholder="City, country"
              :aria-invalid="!!validationErrors.localisation"
              aria-describedby="location-error"
              @input="clearValidation('localisation')"
            /><small v-if="validationErrors.localisation" id="location-error" class="field-error">{{
              validationErrors.localisation
            }}</small></label
          ><label :class="{ 'field-invalid': validationErrors.poste }"
            >Position *<select
              v-model="form.poste"
              name="position"
              required
              :aria-invalid="!!validationErrors.poste"
              aria-describedby="position-error"
              @change="clearValidation('poste')"
            >
              <option disabled value="">Select a position</option>
              <option
                v-for="position in store.positions"
                :key="position.id"
                :value="position.titre"
              >
                {{ label(position.titre) }}
              </option></select
            ><small v-if="validationErrors.poste" id="position-error" class="field-error">{{
              validationErrors.poste
            }}</small></label
          ><label :class="{ 'field-invalid': validationErrors.statut }"
            >Hiring stage *<select
              v-model="form.statut"
              name="status"
              required
              :aria-invalid="!!validationErrors.statut"
              aria-describedby="status-error"
              @change="clearValidation('statut')"
            >
              <option v-for="status in store.statuses" :key="status.id" :value="status.nom">
                {{ label(status.nom) }}
              </option></select
            ><small v-if="validationErrors.statut" id="status-error" class="field-error">{{
              validationErrors.statut
            }}</small></label
          ><label :class="{ 'field-invalid': validationErrors.experience }"
            >Experience<input
              v-model="form.experience"
              name="experience"
              maxlength="50"
              placeholder="e.g. 3 years"
              :aria-invalid="!!validationErrors.experience"
              aria-describedby="experience-error"
              @input="clearValidation('experience')"
            /><small v-if="validationErrors.experience" id="experience-error" class="field-error">{{
              validationErrors.experience
            }}</small></label
          ><label :class="{ 'field-invalid': validationErrors.salaireSouhaite }"
            >Expected annual salary (€)<input
              v-model.number="form.salaireSouhaite"
              name="salary"
              type="number"
              min="0"
              max="10000000"
              step="1"
              :aria-invalid="!!validationErrors.salaireSouhaite"
              aria-describedby="salary-error"
              @input="clearValidation('salaireSouhaite')"
            /><small
              v-if="validationErrors.salaireSouhaite"
              id="salary-error"
              class="field-error"
              >{{ validationErrors.salaireSouhaite }}</small
            ></label
          ><label :class="{ 'field-invalid': validationErrors.disponibilite }"
            >Availability<input
              v-model="form.disponibilite"
              name="availability"
              maxlength="100"
              placeholder="e.g. Immediately, 1 month"
              :aria-invalid="!!validationErrors.disponibilite"
              aria-describedby="availability-error"
              @input="clearValidation('disponibilite')"
            /><small
              v-if="validationErrors.disponibilite"
              id="availability-error"
              class="field-error"
              >{{ validationErrors.disponibilite }}</small
            ></label
          ><label :class="{ 'field-invalid': validationErrors.dateCandidature }"
            >Application date *<input
              v-model="date"
              name="applicationDate"
              type="date"
              required
              :max="new Date().toISOString().slice(0, 10)"
              :aria-invalid="!!validationErrors.dateCandidature"
              aria-describedby="date-error"
              @input="clearValidation('dateCandidature')"
            /><small v-if="validationErrors.dateCandidature" id="date-error" class="field-error">{{
              validationErrors.dateCandidature
            }}</small></label
          ><label class="full-width" :class="{ 'field-invalid': validationErrors.competences }"
            >Skills<input
              v-model="skillsText"
              name="skills"
              maxlength="1000"
              placeholder="Vue.js, TypeScript, Pinia"
              :aria-invalid="!!validationErrors.competences"
              aria-describedby="skills-help skills-error"
              @input="clearValidation('competences')"
            /><small id="skills-help">Separate skills with commas.</small
            ><small v-if="validationErrors.competences" id="skills-error" class="field-error">{{
              validationErrors.competences
            }}</small></label
          ><label class="full-width" :class="{ 'field-invalid': validationErrors.cv }"
            >CV link<input
              v-model="form.cv"
              name="cv"
              type="url"
              maxlength="2000"
              placeholder="https://example.com/resume.pdf"
              :aria-invalid="!!validationErrors.cv"
              aria-describedby="cv-help cv-error"
              @input="clearValidation('cv')"
            /><small id="cv-help">Add a link to a hosted résumé.</small
            ><small v-if="validationErrors.cv" id="cv-error" class="field-error">{{
              validationErrors.cv
            }}</small></label
          ><label class="full-width" :class="{ 'field-invalid': validationErrors.lettreMotivation }"
            >Cover letter<textarea
              v-model="form.lettreMotivation"
              name="coverLetter"
              rows="5"
              maxlength="10000"
              placeholder="A little about the candidate and what brings them here…"
              :aria-invalid="!!validationErrors.lettreMotivation"
              aria-describedby="cover-letter-error"
              @input="clearValidation('lettreMotivation')"
            /><small
              v-if="validationErrors.lettreMotivation"
              id="cover-letter-error"
              class="field-error"
              >{{ validationErrors.lettreMotivation }}</small
            >
          </label>
        </div>
      </fieldset>
      <div class="form-actions">
        <RouterLink class="btn btn-secondary" :to="id ? `/candidatures/${id}` : '/candidatures'"
          >Cancel</RouterLink
        ><button class="btn btn-primary" :disabled="saving">
          <Check :size="17" />{{ saving ? 'Saving…' : id ? 'Save changes' : 'Add candidate' }}
        </button>
      </div>
    </form>
  </div>
</template>
