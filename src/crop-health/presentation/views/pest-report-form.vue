<script setup>
import {ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {useToast} from "primevue";
import useCropHealthStore from "../../application/crop-health.store.js";
import {RecordPestReportCommand} from "../../domain/model/commands/record-pest-report.command.js";
import PageHeader from "../../../shared/presentation/components/page-header.vue";

/** The farmer reports a pest or disease (Angular `PestReportForm`). */
const store = useCropHealthStore();
const router = useRouter();
const toast = useToast();
const { t } = useI18n();

const severities = [
  { value: 'LOW', label: 'crop-health.severity-low' },
  { value: 'MEDIUM', label: 'crop-health.severity-medium' },
  { value: 'HIGH', label: 'crop-health.severity-high' }
];
const form = ref({ plotId: null, description: '', severity: 'LOW' });
const submitted = ref(false);
const saved = ref(false);
const formDisabled = ref(false);

const descriptionInvalid = () => form.value.description.trim().length < 10;

watch(() => store.scopeReady, ready => {
  saved.value = false;
  submitted.value = false;
  form.value = { plotId: ready ? (store.selectedPlot?.id ?? null) : null, description: '', severity: 'LOW' };
}, { immediate: true });

/** Sends the report. */
const onSubmit = () => {
  submitted.value = true;
  saved.value = false;
  const user = store.activeUser;
  if (!form.value.plotId || descriptionInvalid() || store.saving || !user) return;
  const plotId = form.value.plotId;
  formDisabled.value = true;
  store.recordReport(new RecordPestReportCommand({
    plotId, reporterId: user.id, description: form.value.description.trim(),
    severity: form.value.severity, photo: '', clientSyncId: crypto.randomUUID()
  }), () => {
    form.value = { plotId, description: '', severity: 'LOW' };
    submitted.value = false;
    formDisabled.value = false;
    saved.value = true;
    toast.add({ severity: 'success', summary: t('crop-health.report-saved'), life: 7000 });
  }, () => formDisabled.value = false);
};
</script>

<template>
  <div class="page narrow">
    <page-header :eyebrow="t('crop-health.eyebrow')" :title="t('crop-health.form-title')"/>
    <pv-progress-bar v-if="store.scopeLoading || store.saving" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>
    <p v-if="store.scopeError" class="sa-error m-0" role="alert">{{ t(store.scopeError) }}</p>
    <p v-if="store.writeError" class="sa-error m-0" role="alert">{{ t(store.writeError) }}</p>
    <div v-if="saved" class="success-banner" role="status">
      <i class="pi pi-check-circle text-xl" aria-hidden="true"/>
      <div class="flex-1"><strong>{{ t('crop-health.report-saved') }}</strong><p class="mt-1 mb-0">{{ t('crop-health.report-next-step') }}</p></div>
      <pv-button text :label="t('crop-health.view-inbox')" @click="router.push('/crop-health/inbox')"/>
    </div>
    <p v-if="!store.scopeLoading && !store.scopeError && store.plots.length === 0">{{ t('crop-health.no-plots') }}</p>

    <pv-card class="sa-card">
      <template #content>
        <form class="flex flex-column gap-3" novalidate @submit.prevent="onSubmit">
          <div class="sa-field">
            <label for="plot">{{ t('crop-health.plot') }}</label>
            <pv-select v-model="form.plotId" input-id="plot" :options="store.plots" option-label="name" option-value="id"
                       :invalid="submitted && !form.plotId" :disabled="!store.canReport" fluid/>
            <small v-if="submitted && !form.plotId" class="sa-error">{{ t('crop-health.required-field') }}</small>
          </div>
          <div class="sa-field">
            <label for="description">{{ t('crop-health.form-describe') }}</label>
            <pv-textarea id="description" v-model="form.description" rows="4" :invalid="submitted && descriptionInvalid()" :disabled="!store.canReport" fluid/>
            <small v-if="submitted && descriptionInvalid()" class="sa-error">{{ t('crop-health.description-length') }}</small>
          </div>
          <div class="sa-field">
            <label for="severity">{{ t('crop-health.form-severity') }}</label>
            <pv-select v-model="form.severity" input-id="severity" :options="severities" option-value="value" :disabled="!store.canReport" fluid>
              <template #value="{ value }">{{ t(severities.find(item => item.value === value)?.label ?? '') }}</template>
              <template #option="{ option }">{{ t(option.label) }}</template>
            </pv-select>
          </div>
          <div class="flex flex-wrap justify-content-end gap-3">
            <pv-button type="submit" class="sa-pill" :label="t('crop-health.btn-send-report')"
                       :disabled="formDisabled || store.saving || store.scopeLoading || !!store.scopeError || !store.canReport"/>
            <pv-button outlined class="sa-pill" :label="t('crop-health.inbox-title')" @click="router.push('/crop-health/inbox')"/>
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

.success-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
  padding: 18px;
  border-radius: 16px;
  background: var(--sa-secondary-container);
  color: var(--sa-on-secondary-container);
}
</style>
