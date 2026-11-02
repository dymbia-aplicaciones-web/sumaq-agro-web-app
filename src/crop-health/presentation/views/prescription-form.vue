<script setup>
import {ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import useCropHealthStore from "../../application/crop-health.store.js";
import {IssueTechnicalPrescriptionCommand} from "../../domain/model/commands/issue-technical-prescription.command.js";
import PageHeader from "../../../shared/presentation/components/page-header.vue";
import MessageCard from "../../../shared/presentation/components/message-card.vue";
import {toApiDate} from "../../../shared/infrastructure/base-assembler.js";

/** The agronomist issues a technical prescription (Angular `PrescriptionForm`). */
const store = useCropHealthStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const caseId = Number(route.query['reportId']) || 0;
const emptyForm = (reportId = null) => ({ reportId, agrochemical: '', dosage: '', instructions: '', applicationDate: null });
const form = ref(emptyForm());
const submitted = ref(false);
const saved = ref(false);
const formDisabled = ref(false);
const missing = field => submitted.value && !String(form.value[field] ?? '').trim();

watch(() => store.scopeReady, ready => {
  saved.value = false;
  if (!ready) return;
  store.loadClinicalData(() => {
    formDisabled.value = false;
    form.value = emptyForm();
    submitted.value = false;
    if (store.treatableReports.some(report => report.id === caseId)) form.value.reportId = caseId;
  });
}, { immediate: true });

/** Issues the prescription. */
const onSubmit = () => {
  submitted.value = true;
  saved.value = false;
  const value = form.value;
  if (!value.reportId || !value.agrochemical.trim() || !value.dosage.trim() || !value.instructions.trim() || !value.applicationDate) return;
  const agronomistId = store.activeUser?.id ?? 0;
  if (!store.canPrescribe || store.clinicalLoading || store.saving) return;
  if (!store.pestReports.some(report => report.id === value.reportId) || !store.advisors.some(advisor => advisor.userId === agronomistId)) return;
  formDisabled.value = true;
  store.issuePrescription(new IssueTechnicalPrescriptionCommand({
    reportId: value.reportId,
    agronomistId,
    recommendedProducts: value.agrochemical.trim(),
    dosageInstructions: `${value.dosage.trim()}\n${value.instructions.trim()}`,
    applicationDate: toApiDate(value.applicationDate)
  }), () => {
    form.value = emptyForm(value.reportId);
    submitted.value = false;
    formDisabled.value = false;
    saved.value = true;
  }, () => formDisabled.value = false);
};
</script>

<template>
  <div class="page narrow">
    <div v-if="caseId"><pv-button text :label="t('crop-health.case.open')" @click="router.push(`/crop-health/reports/${caseId}`)"/></div>
    <page-header :eyebrow="t('crop-health.eyebrow')" :title="t('crop-health.prescribe-title')"/>
    <p v-if="store.writeError" class="sa-error m-0" role="alert">{{ t(store.writeError) }}</p>
    <p class="m-0">{{ t('crop-health.workflow-demo') }}</p>
    <pv-progress-bar v-if="store.clinicalLoading || store.saving" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>
    <message-card v-if="store.clinicalError" icon="pi pi-times-circle" :message="t(store.clinicalError)" alert/>
    <p v-if="saved" role="status" class="m-0">{{ t('crop-health.prescription-saved') }}</p>
    <p v-if="!store.clinicalLoading && !store.clinicalError && store.treatableReports.length === 0" class="m-0">{{ t('crop-health.inspection-required') }}</p>
    <p v-if="!store.clinicalLoading && !store.clinicalError && store.advisors.length === 0" class="m-0">{{ t('crop-health.no-advisors') }}</p>

    <pv-card class="sa-card">
      <template #content>
        <form class="flex flex-column gap-3" novalidate @submit.prevent="onSubmit">
          <div class="sa-field">
            <label for="report">{{ t('crop-health.related-report') }}</label>
            <pv-select v-model="form.reportId" input-id="report" :options="store.treatableReports" option-value="id"
                       :option-label="report => `${store.reportLabel(report.id)} · ${report.description}`" :invalid="submitted && !form.reportId" fluid/>
            <small v-if="submitted && !form.reportId" class="sa-error">{{ t('crop-health.required-field') }}</small>
          </div>
          <p class="m-0">{{ t('crop-health.agronomist') }}: {{ store.currentAdvisor?.name }}</p>
          <div class="sa-field">
            <label for="agrochemical">{{ t('crop-health.form-agrochemical') }}</label>
            <pv-input-text id="agrochemical" v-model="form.agrochemical" :invalid="missing('agrochemical')" fluid/>
            <small v-if="missing('agrochemical')" class="sa-error">{{ t('crop-health.required-field') }}</small>
          </div>
          <div class="sa-field">
            <label for="dosage">{{ t('crop-health.form-dosage') }}</label>
            <pv-input-text id="dosage" v-model="form.dosage" :invalid="missing('dosage')" fluid/>
            <small v-if="missing('dosage')" class="sa-error">{{ t('crop-health.required-field') }}</small>
          </div>
          <div class="sa-field">
            <label for="instructions">{{ t('crop-health.form-instructions') }}</label>
            <pv-textarea id="instructions" v-model="form.instructions" rows="4" :invalid="missing('instructions')" fluid/>
            <small v-if="missing('instructions')" class="sa-error">{{ t('crop-health.required-field') }}</small>
          </div>
          <div class="sa-field">
            <label for="application-date">{{ t('crop-health.application-date') }}</label>
            <pv-date-picker v-model="form.applicationDate" input-id="application-date" date-format="dd/mm/yy" :min-date="new Date()" show-icon
                            :invalid="submitted && !form.applicationDate" fluid/>
            <small v-if="submitted && !form.applicationDate" class="sa-error">{{ t('crop-health.required-field') }}</small>
          </div>
          <div class="flex flex-wrap justify-content-end gap-3">
            <pv-button type="submit" class="sa-pill" :label="t('crop-health.btn-issue-prescription')"
                       :disabled="formDisabled || store.clinicalLoading || store.saving || store.treatableReports.length === 0 || store.advisors.length === 0"/>
            <pv-button outlined class="sa-pill" :label="t('crop-health.history-title')" @click="router.push('/crop-health/prescriptions')"/>
          </div>
        </form>
      </template>
    </pv-card>
  </div>
</template>

<style scoped>
.narrow {
  max-width: 680px;
}
</style>
