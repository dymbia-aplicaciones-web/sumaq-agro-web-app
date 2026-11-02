<script setup>
import {computed, nextTick, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import useCropHealthStore from "../../application/crop-health.store.js";
import {todayInLima} from "../../domain/model/validation.js";
import {formatDate} from "../../../shared/presentation/format.js";
import MessageCard from "../../../shared/presentation/components/message-card.vue";

/**
 * Incident dossier with visits, prescriptions and immutable farmer follow-up (Angular `FarmerCaseView`).
 * Absence, loading and failed queries are separate states. Application/evolution
 * evidence does not close the report or replace the agronomist's assessment.
 */
const store = useCropHealthStore();
const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();

const id = computed(() => Number(route.params.id));
const report = computed(() => store.pestReports.find(item => item.id === id.value));
const inspections = computed(() => store.inspections.filter(item => item.reportId === id.value));
const prescriptions = computed(() => store.prescriptions.filter(item => item.reportId === id.value));
const evidence = computed(() => store.followUps
    .filter(item => item.data.reportId === id.value)
    .sort((a, b) => a.data.occurredOn.localeCompare(b.data.occurredOn) || a.data.recordedAt.localeCompare(b.data.recordedAt)));
const evaluations = computed(() => store.assessments
    .filter(item => item.data.reportId === id.value)
    .sort((a, b) => a.data.recordedAt.localeCompare(b.data.recordedAt)));

const prescriptionOptions = computed(() => prescriptions.value.map(rx => ({ value: Number(rx.id), label: rx.recommendedProducts })));
const kindOptions = computed(() => ['APPLICATION', 'EVOLUTION'].map(value => ({ value, label: t(`crop-health.case.${value}`) })));
const outcomeOptions = computed(() => ['FOLLOW_UP_REQUIRED', 'RECOVERED'].map(value => ({ value, label: t(`crop-health.advisor.${value}`) })));

const saved = ref(false);
const loaded = ref(false);
const today = todayInLima();
const assessmentSection = ref();

const emptyForm = () => ({ prescriptionId: 0, kind: 'APPLICATION', occurredOn: todayInLima(), notes: '' });
const form = ref(emptyForm());
const formTouched = ref(false);
const formDisabled = ref(false);
let draft = null;

const assessmentForm = ref({ outcome: 'FOLLOW_UP_REQUIRED', notes: '' });
const assessmentTouched = ref(false);
const assessmentDisabled = ref(false);
const assessmentSaved = ref(false);
let assessmentDraft = null;

const notesInvalid = (value) => value.trim().length < 10 || value.length > 2000;
const formInvalid = computed(() => form.value.prescriptionId < 1 || !form.value.occurredOn || notesInvalid(form.value.notes));

/** Loads the authorized report dossier without querying arbitrary report IDs directly. */
const reload = () => {
  loaded.value = false;
  if (store.scopeError) {
    store.retryScope();
    return;
  }
  store.loadClinicalData(() => {
    loaded.value = true;
    if (!form.value.prescriptionId) form.value.prescriptionId = Number(prescriptions.value[0]?.id ?? 0);
    if (route.hash === '#assessment') nextTick(() => assessmentSection.value?.scrollIntoView({ block: 'start' }));
  });
};

watch([() => store.scopeReady, () => store.activeUser, id], ([ready, user, reportId]) => {
  loaded.value = false;
  saved.value = false;
  draft = null;
  assessmentDraft = null;
  assessmentSaved.value = false;
  assessmentDisabled.value = false;
  assessmentForm.value = { outcome: 'FOLLOW_UP_REQUIRED', notes: '' };
  assessmentTouched.value = false;
  formDisabled.value = false;
  form.value = emptyForm();
  formTouched.value = false;
  if (ready && user && Number.isSafeInteger(reportId) && reportId > 0) reload();
  else if (ready) loaded.value = true;
}, { immediate: true });

/** Records the professional conclusion with a stable ID retained on failed writes. */
const evaluate = () => {
  assessmentSaved.value = false;
  assessmentTouched.value = true;
  const value = assessmentForm.value;
  const notes = value.notes.trim();
  if (notesInvalid(value.notes) || store.saving || !store.canAssess(id.value)) return;
  const fingerprint = JSON.stringify({ ...value, notes, reportId: id.value });
  if (assessmentDraft?.fingerprint !== fingerprint) assessmentDraft = { fingerprint, id: crypto.randomUUID() };
  assessmentDisabled.value = true;
  store.recordAssessment({ ...value, notes, reportId: id.value, id: assessmentDraft.id }, () => {
    assessmentDisabled.value = false;
    assessmentForm.value = { outcome: 'FOLLOW_UP_REQUIRED', notes: '' };
    assessmentTouched.value = false;
    assessmentDraft = null;
    assessmentSaved.value = true;
  }, () => assessmentDisabled.value = false);
};

/**
 * Shows the prescribed product beside each evidence record.
 * @param {number} prescriptionId - Prescription.
 * @returns {string} Product of the prescription.
 */
const prescriptionLabel = (prescriptionId) => prescriptions.value.find(item => item.id === prescriptionId)?.recommendedProducts ?? `#${prescriptionId}`;

/**
 * Sends validated evidence; retries keep the same client ID and preserve failed drafts.
 * Application IDs are deterministic per prescription and producer to prevent
 * duplicate confirmations after an interrupted response from the fake API.
 */
const submit = () => {
  saved.value = false;
  formTouched.value = true;
  if (formInvalid.value || store.saving || store.clinicalLoading || !report.value) return;
  const value = form.value;
  const notes = value.notes.trim();
  const fingerprint = JSON.stringify({ ...value, notes, reportId: id.value });
  if (draft?.fingerprint !== fingerprint)
    draft = {
      fingerprint,
      id: value.kind === 'APPLICATION' ? `application-${value.prescriptionId}-${store.activeUser.id}` : crypto.randomUUID()
    };
  formDisabled.value = true;
  store.recordFollowUp({ ...value, notes, id: draft.id, reportId: id.value }, () => {
    formDisabled.value = false;
    form.value = { ...form.value, notes: '', kind: 'EVOLUTION' };
    formTouched.value = false;
    draft = null;
    saved.value = true;
  }, () => formDisabled.value = false);
};

const dateTime = (value) => formatDate(value, locale.value, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' });
const longDate = (value) => formatDate(value, locale.value, { dateStyle: 'long' });
</script>

<template>
  <div class="page farmer-case">
    <div><pv-button text icon="pi pi-arrow-left" :label="t('crop-health.inbox-title')" @click="router.push('/crop-health/inbox')"/></div>
    <h1>{{ t('crop-health.case.title') }}</h1>
    <pv-progress-bar v-if="store.clinicalLoading || store.saving" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>
    <template v-if="store.clinicalError">
      <p class="sa-error" role="alert">{{ t(store.clinicalError) }}</p>
      <div><pv-button outlined :label="t('common.retry')" @click="reload"/></div>
    </template>
    <p v-if="store.writeError" class="sa-error" role="alert">{{ t(store.writeError) }}</p>

    <template v-if="!store.clinicalLoading && !store.clinicalError && loaded">
      <template v-if="report">
        <pv-card class="sa-card">
          <template #title>{{ report.plotName }}</template>
          <template #subtitle>{{ t(`crop-health.report-statuses.${report.status}`) }}</template>
          <template #content>
            <div class="card-body">
              <p>{{ t('crop-health.advisor.producer') }}: {{ store.producerName(report.reporterId) }} · #{{ report.reporterId }}</p>
              <p>{{ report.description }}</p>
              <a v-if="report.photo" :href="report.photo" target="_blank" rel="noopener noreferrer">{{ t('crop-health.view-photo') }}</a>
              <nav class="flex flex-wrap gap-2">
                <pv-button v-if="store.canSchedule && report.status === 'PENDING'" outlined :label="t('crop-health.inspections-title')"
                           @click="router.push({ path: '/crop-health/inspections', query: { reportId: report.id } })"/>
                <pv-button v-if="store.canPrescribe && report.status === 'INSPECTED'" outlined :label="t('crop-health.btn-prescribe')"
                           @click="router.push({ path: '/crop-health/prescribe', query: { reportId: report.id } })"/>
              </nav>
              <p>{{ t('crop-health.form-severity') }}: {{ t(`crop-health.severities.${report.severity}`) }}</p>
            </div>
          </template>
        </pv-card>

        <h2>{{ t('crop-health.inspections-title') }}</h2>
        <pv-card v-for="visit in inspections" :key="visit.id" class="sa-card">
          <template #content>
            <div class="card-body">
              <p>{{ dateTime(visit.scheduledAt) }} · {{ t(`crop-health.case.${visit.status}`) }}</p>
              <p>{{ visit.notes }}</p>
              <p v-if="visit.completedAt">{{ dateTime(visit.completedAt) }} · {{ store.advisorName(visit.inspectorUserId) }}</p>
            </div>
          </template>
        </pv-card>
        <p v-if="inspections.length === 0">{{ t('crop-health.case.no-inspections') }}</p>

        <h2>{{ t('crop-health.history-title') }}</h2>
        <pv-card v-for="rx in prescriptions" :key="rx.id" class="sa-card">
          <template #title>{{ rx.recommendedProducts }}</template>
          <template #content>
            <div class="card-body">
              <p class="notes">{{ rx.dosageInstructions }}</p>
              <p>{{ longDate(rx.applicationDate) }} · {{ store.advisorName(rx.agronomistId) }}</p>
            </div>
          </template>
        </pv-card>
        <p v-if="prescriptions.length === 0">{{ t('crop-health.case.no-prescriptions') }}</p>

        <h2>{{ t('crop-health.case.follow-up') }}</h2>
        <p>{{ t('crop-health.case.evaluation-notice') }}</p>
        <pv-card v-for="item in evidence" :key="item.data.id" class="sa-card">
          <template #content>
            <div class="card-body">
              <p><strong>{{ t(`crop-health.case.${item.data.kind}`) }}</strong> · {{ longDate(item.data.occurredOn) }}</p>
              <p>{{ prescriptionLabel(item.data.prescriptionId) }}</p>
              <p class="notes">{{ item.data.notes }}</p>
            </div>
          </template>
        </pv-card>
        <p v-if="evidence.length === 0">{{ t('crop-health.case.no-follow-up') }}</p>

        <form v-if="store.canReport && report.status === 'INSPECTED' && prescriptions.length" class="case-form" novalidate @submit.prevent="submit">
          <h2>{{ t('crop-health.case.record') }}</h2>
          <p v-if="formInvalid && formTouched" class="sa-error full" role="alert">{{ t('crop-health.case.form-validation') }}</p>
          <div class="sa-field">
            <label for="follow-up-prescription">{{ t('crop-health.case.prescription') }}</label>
            <pv-select v-model="form.prescriptionId" input-id="follow-up-prescription" :options="prescriptionOptions"
                       option-label="label" option-value="value" :disabled="formDisabled" fluid/>
          </div>
          <div class="sa-field">
            <label for="follow-up-kind">{{ t('crop-health.case.kind') }}</label>
            <pv-select v-model="form.kind" input-id="follow-up-kind" :options="kindOptions" option-label="label" option-value="value"
                       :disabled="formDisabled" fluid/>
          </div>
          <div class="sa-field">
            <label for="follow-up-date">{{ t('crop-health.case.date') }}</label>
            <input id="follow-up-date" v-model="form.occurredOn" type="date" :max="today" class="p-inputtext p-component" :disabled="formDisabled"/>
          </div>
          <div class="sa-field full">
            <label for="follow-up-notes">{{ t('crop-health.case.notes') }}</label>
            <pv-textarea id="follow-up-notes" v-model="form.notes" rows="4" maxlength="2000" :disabled="formDisabled"
                         :invalid="formTouched && notesInvalid(form.notes)" fluid/>
            <small v-if="formTouched && notesInvalid(form.notes)" class="sa-error">{{ t('crop-health.case.notes-validation') }}</small>
          </div>
          <div class="full">
            <pv-button type="submit" :label="t('crop-health.case.save')" :disabled="store.saving || store.clinicalLoading || formDisabled"/>
          </div>
        </form>

        <section id="assessment" ref="assessmentSection" class="assessment">
          <h2>{{ t('crop-health.advisor.assessments') }}</h2>
          <pv-card v-for="evaluation in evaluations" :key="evaluation.data.id" class="sa-card">
            <template #content>
              <div class="card-body">
                <p><strong>{{ t(`crop-health.advisor.${evaluation.data.outcome}`) }}</strong></p>
                <p>{{ store.advisorName(evaluation.data.agronomistUserId) }} · {{ dateTime(evaluation.data.recordedAt) }}</p>
                <p class="notes">{{ evaluation.data.notes }}</p>
                <p>{{ t('crop-health.advisor.evidence-reviewed') }}: {{ evaluation.data.evidenceIds.length }}</p>
              </div>
            </template>
          </pv-card>
          <p v-if="evaluations.length === 0">{{ t('crop-health.advisor.no-assessments') }}</p>
          <template v-if="store.canPrescribe && report.status === 'INSPECTED'">
            <p>{{ t('crop-health.advisor.assessment-notice') }}</p>
            <form v-if="store.canAssess(report.id)" class="flex flex-column gap-3" novalidate @submit.prevent="evaluate">
              <div class="sa-field">
                <label for="assessment-outcome">{{ t('crop-health.advisor.conclusion') }}</label>
                <pv-select v-model="assessmentForm.outcome" input-id="assessment-outcome" :options="outcomeOptions"
                           option-label="label" option-value="value" :disabled="assessmentDisabled" fluid/>
              </div>
              <div class="sa-field">
                <label for="assessment-notes">{{ t('crop-health.advisor.assessment-notes') }}</label>
                <pv-textarea id="assessment-notes" v-model="assessmentForm.notes" rows="4" maxlength="2000" :disabled="assessmentDisabled"
                             :invalid="assessmentTouched && notesInvalid(assessmentForm.notes)" fluid/>
                <small v-if="assessmentTouched && notesInvalid(assessmentForm.notes)" class="sa-error">{{ t('crop-health.case.notes-validation') }}</small>
              </div>
              <div><pv-button type="submit" :label="t('crop-health.advisor.save-evaluation')" :disabled="store.saving || assessmentDisabled"/></div>
            </form>
            <p v-else>{{ t('crop-health.advisor.awaiting-evidence') }}</p>
          </template>
          <p v-if="assessmentSaved" role="status">{{ t('crop-health.advisor.evaluation-saved') }}</p>
        </section>

        <p v-if="saved" role="status">{{ t('crop-health.case.saved') }}</p>
      </template>
      <message-card v-else icon="pi pi-search" :message="t('crop-health.case.not-found')"/>
    </template>
  </div>
</template>

<style scoped>
.farmer-case {
  gap: 16px;
  max-width: 1000px;
}

h1,
h2,
p {
  margin: 0;
  overflow-wrap: anywhere;
}

h1 {
  font-size: 30px;
}

h2 {
  font-size: 20px;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notes {
  white-space: pre-wrap;
}

.case-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.case-form h2,
.full {
  grid-column: 1 / -1;
}

@media (max-width: 600px) {
  .case-form {
    grid-template-columns: minmax(0, 1fr);
  }
}

.assessment {
  display: flex;
  flex-direction: column;
  gap: 16px;
  scroll-margin-top: 90px;
}
</style>
