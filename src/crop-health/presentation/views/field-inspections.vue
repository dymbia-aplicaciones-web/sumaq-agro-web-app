<script setup>
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import useCropHealthStore from "../../application/crop-health.store.js";
import {ScheduleFieldInspectionCommand} from "../../domain/model/commands/schedule-field-inspection.command.js";
import PageHeader from "../../../shared/presentation/components/page-header.vue";
import MessageCard from "../../../shared/presentation/components/message-card.vue";
import {formatDate} from "../../../shared/presentation/format.js";

/** Schedules and completes authorized inspections, optionally within a case dossier (Angular `FieldInspectionsView`). */
const store = useCropHealthStore();
const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();

const caseId = Number(route.query['reportId']) || 0;
/** Keeps the inspection workspace attached to the selected authorized case. */
const caseInspections = computed(() => store.inspections.filter(item => !caseId || item.reportId === caseId));

const form = ref({ reportId: null, scheduledAt: null, notes: '' });
const submitted = ref(false);
const formDisabled = ref(false);
const saved = ref(false);
const savedMessage = ref('crop-health.inspection-saved');
const completionNotes = ref({});

const load = () => store.loadClinicalData(() => {
  formDisabled.value = false;
  form.value = { reportId: null, scheduledAt: null, notes: '' };
  submitted.value = false;
  completionNotes.value = {};
  if (store.schedulableReports.some(report => report.id === caseId)) form.value.reportId = caseId;
});

watch(() => store.scopeReady, ready => {
  saved.value = false;
  if (ready) load();
}, { immediate: true });

/** Validates the visit date and persists the selected scoped report. */
const onSubmit = () => {
  saved.value = false;
  submitted.value = true;
  const value = form.value;
  if (!value.reportId || !value.scheduledAt || !store.canSchedule || store.clinicalLoading || store.saving) return;
  if (!store.pestReports.some(report => report.id === value.reportId)) return;
  formDisabled.value = true;
  store.scheduleInspection(new ScheduleFieldInspectionCommand({
    reportId: value.reportId,
    scheduledAt: value.scheduledAt.toISOString(),
    notes: value.notes.trim()
  }), () => {
    form.value = { reportId: value.reportId, scheduledAt: null, notes: '' };
    submitted.value = false;
    formDisabled.value = false;
    savedMessage.value = 'crop-health.inspection-saved';
    saved.value = true;
  }, () => formDisabled.value = false);
};

/**
 * Records professional findings and synchronizes the report status.
 * @param {number} id - Inspection to complete.
 */
const complete = (id) => {
  saved.value = false;
  store.completeInspection(id, completionNotes.value[id] ?? '', () => {
    savedMessage.value = 'crop-health.inspection-completed';
    saved.value = true;
  }, () => {});
};

const dateTime = (value) => formatDate(value, locale.value, { dateStyle: 'medium', timeStyle: 'short' });
</script>

<template>
  <div class="page">
    <div v-if="caseId"><pv-button text :label="t('crop-health.case.open')" @click="router.push(`/crop-health/reports/${caseId}`)"/></div>
    <page-header :eyebrow="t('crop-health.clinical-eyebrow')" :title="t('crop-health.inspections-title')"/>
    <nav><pv-button outlined class="sa-pill" :label="t('crop-health.inbox-title')" @click="router.push('/crop-health/inbox')"/></nav>
    <p v-if="store.writeError" class="sa-error m-0" role="alert">{{ t(store.writeError) }}</p>
    <pv-progress-bar v-if="store.clinicalLoading || store.saving" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>
    <message-card v-if="store.clinicalError" icon="pi pi-times-circle" :message="t(store.clinicalError)" alert/>
    <p v-if="saved" role="status" class="m-0">{{ t(savedMessage) }}</p>

    <pv-card v-if="!store.clinicalLoading && !store.clinicalError && store.canSchedule" class="sa-card">
      <template #content>
        <form class="flex flex-column gap-3 inspection-form" novalidate @submit.prevent="onSubmit">
          <div class="sa-field">
            <label for="report">{{ t('crop-health.related-report') }}</label>
            <pv-select v-model="form.reportId" input-id="report" :options="store.schedulableReports" option-value="id"
                       :option-label="report => `${store.reportLabel(report.id)} · ${report.description}`"
                       :disabled="formDisabled" :invalid="submitted && !form.reportId" fluid/>
            <small v-if="submitted && !form.reportId" class="sa-error">{{ t('crop-health.required-field') }}</small>
          </div>
          <div class="sa-field">
            <label for="scheduled-at">{{ t('crop-health.scheduled-at') }}</label>
            <pv-date-picker v-model="form.scheduledAt" input-id="scheduled-at" show-time hour-format="24" date-format="dd/mm/yy"
                            :min-date="new Date()" show-icon :disabled="formDisabled" :invalid="submitted && !form.scheduledAt" fluid/>
            <small v-if="submitted && !form.scheduledAt" class="sa-error">{{ t('crop-health.required-field') }}</small>
          </div>
          <div class="sa-field">
            <label for="notes">{{ t('crop-health.inspection-notes') }}</label>
            <pv-textarea id="notes" v-model="form.notes" rows="3" :disabled="formDisabled" fluid/>
          </div>
          <div>
            <pv-button type="submit" class="sa-pill" :label="t('crop-health.schedule-inspection')"
                       :disabled="formDisabled || store.clinicalLoading || store.saving || store.schedulableReports.length === 0"/>
          </div>
        </form>
      </template>
    </pv-card>

    <div v-if="!store.clinicalLoading && !store.clinicalError" class="flex flex-column gap-3">
      <pv-card v-for="inspection in caseInspections" :key="inspection.id" class="inspection-card">
        <template #title>{{ store.reportLabel(inspection.reportId) }}</template>
        <template #subtitle>{{ t('crop-health.scheduled-at') }}: {{ dateTime(inspection.scheduledAt) }}</template>
        <template #content>
          <p>{{ t(`crop-health.inspection-statuses.${inspection.status}`) }}</p>
          <p>{{ inspection.notes }}</p>
          <p v-if="inspection.completedAt">{{ t('crop-health.completed-at') }}: {{ dateTime(inspection.completedAt) }}</p>
          <template v-if="store.canComplete(inspection)">
            <div class="sa-field mb-3">
              <label :for="`completion-${inspection.id}`">{{ t('crop-health.completion-notes') }}</label>
              <pv-textarea :id="`completion-${inspection.id}`" v-model="completionNotes[inspection.id]" rows="3" :disabled="store.saving" fluid/>
            </div>
            <pv-button :disabled="store.saving" @click="complete(inspection.id)"
                       :label="t(inspection.status === 'COMPLETED' ? 'crop-health.sync-report' : 'crop-health.complete-inspection')"/>
          </template>
        </template>
      </pv-card>
      <message-card v-if="caseInspections.length === 0" icon="pi pi-map-marker" :message="t('crop-health.no-inspections')"/>
    </div>
  </div>
</template>

<style scoped>
.inspection-form {
  max-width: 680px;
}

.inspection-card {
  border: 1px solid var(--sa-outline-variant);
  border-left: 5px solid var(--sa-primary);
  border-radius: var(--sa-radius-card);
  box-shadow: none;
}
</style>
