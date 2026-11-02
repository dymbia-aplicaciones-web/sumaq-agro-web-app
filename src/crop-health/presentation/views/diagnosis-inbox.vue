<script setup>
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import {useToast} from "primevue";
import useCropHealthStore from "../../application/crop-health.store.js";
import PageHeader from "../../../shared/presentation/components/page-header.vue";
import MessageCard from "../../../shared/presentation/components/message-card.vue";
import PlotSelector from "../components/plot-selector.vue";
import FarmerAdvisoryPanel from "../../../profiles/presentation/components/farmer-advisory-panel.vue";

/** Role-scoped work list with independent plot, severity and workflow filters (Angular `DiagnosisInboxView`). */
const store = useCropHealthStore();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const { t } = useI18n();

const deletingId = ref(null);
const plotFilter = ref(0);
const severityFilter = ref('ALL');
const statusFilter = ref('ALL');

const plotOptions = computed(() => [{ id: 0, name: t('crop-health.advisor.all') }, ...store.plots]);
const severityOptions = computed(() => ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'SEVERE'].map(value => ({
  value, label: value === 'ALL' ? t('crop-health.advisor.all') : t(`crop-health.severities.${value}`)
})));
const statusOptions = computed(() => ['ALL', 'PENDING', 'INSPECTED', 'RESOLVED'].map(value => ({
  value, label: value === 'ALL' ? t('crop-health.advisor.all') : t(`crop-health.report-statuses.${value}`)
})));

const reports = computed(() => store.pestReports
    .filter(report => (!plotFilter.value || report.plotId === plotFilter.value)
        && (severityFilter.value === 'ALL' || report.severity === severityFilter.value)
        && (statusFilter.value === 'ALL' || report.status === statusFilter.value))
    .sort((a, b) => Number(b.id) - Number(a.id)));

/** Clears filters without changing the authorization scope or selected satellite plot. */
const resetFilters = () => {
  plotFilter.value = 0;
  severityFilter.value = 'ALL';
  statusFilter.value = 'ALL';
};

watch(() => store.scopeReady, ready => {
  deletingId.value = null;
  resetFilters();
  const requested = Number(route.query['plotId']);
  if (ready && store.plots.some(plot => plot.id === requested)) plotFilter.value = requested;
  if (ready) store.loadClinicalData();
}, { immediate: true });

/** @param {number} id - Report to delete. */
const remove = (id) => store.deleteReport(id, () => {
  deletingId.value = null;
  toast.add({ severity: 'success', summary: t('crop-health.report-deleted'), life: 5000 });
}, () => deletingId.value = null);
</script>

<template>
  <div class="page">
    <plot-selector v-if="store.canReport" :plots="store.plots" :selected-plot-id="store.selectedPlot?.id ?? null"
                   :disabled="store.scopeLoading" class="farmer-plot" @plot-selected="store.selectPlot"/>
    <farmer-advisory-panel v-if="store.canReport && store.selectedPlot" :plot-id="Number(store.selectedPlot.id)"/>

    <page-header :eyebrow="t('crop-health.clinical-eyebrow')" :title="t('crop-health.inbox-title')"/>
    <nav class="flex flex-wrap gap-3">
      <pv-button v-if="store.canPrescribe" outlined class="sa-pill" :label="t('crop-health.advisor.plots')"
                 @click="router.push('/crop-health/assigned-plots')"/>
      <pv-button text :label="t('crop-health.advisor.refresh')" :disabled="store.loading || store.saving" @click="store.retryScope()"/>
      <pv-button v-if="store.canReport" class="sa-pill" icon="pi pi-plus" :label="t('crop-health.new-report')" @click="router.push('/crop-health/report-pest')"/>
      <pv-button outlined class="sa-pill" :label="t('crop-health.inspections-title')" @click="router.push('/crop-health/inspections')"/>
      <pv-button outlined class="sa-pill" :label="t('crop-health.history-title')" @click="router.push('/crop-health/prescriptions')"/>
    </nav>

    <p v-if="store.writeError" class="sa-error m-0" role="alert">{{ t(store.writeError) }}</p>
    <pv-progress-bar v-if="store.clinicalLoading || store.saving" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>
    <message-card v-if="store.clinicalError" icon="pi pi-times-circle" :message="t(store.clinicalError)" alert/>

    <template v-if="!store.clinicalLoading && !store.clinicalError">
      <section class="filters" :aria-label="t('crop-health.advisor.filters')">
        <div class="sa-field">
          <label for="filter-plot">{{ t('crop-health.advisor.plot') }}</label>
          <pv-select v-model="plotFilter" input-id="filter-plot" :options="plotOptions" option-label="name" option-value="id" fluid/>
        </div>
        <div class="sa-field">
          <label for="filter-severity">{{ t('crop-health.form-severity') }}</label>
          <pv-select v-model="severityFilter" input-id="filter-severity" :options="severityOptions" option-label="label" option-value="value" fluid/>
        </div>
        <div class="sa-field">
          <label for="filter-status">{{ t('crop-health.advisor.status') }}</label>
          <pv-select v-model="statusFilter" input-id="filter-status" :options="statusOptions" option-label="label" option-value="value" fluid/>
        </div>
        <pv-button text :label="t('crop-health.advisor.clear-filters')" @click="resetFilters"/>
      </section>
      <p role="status" class="m-0">{{ t('crop-health.advisor.results') }}: {{ reports.length }} / {{ store.pestReports.length }}</p>

      <div class="flex flex-column gap-3">
        <pv-card v-for="report in reports" :key="report.id" class="report-card" :data-status="report.status">
          <template #content>
            <div class="report-row">
              <div class="flex-1" style="min-width: 0">
                <h2 class="report-title"><i class="pi pi-exclamation-circle" aria-hidden="true"/>{{ store.reportLabel(report.id) }}</h2>
                <span class="status-badge">{{ t(`crop-health.report-statuses.${report.status}`) }}</span>
                <p>{{ t('crop-health.advisor.producer') }}: {{ store.producerName(report.reporterId) }} · #{{ report.reporterId }}</p>
                <p class="description">{{ report.description }}</p>
                <p>{{ t('crop-health.form-severity') }}: {{ t(`crop-health.severities.${report.severity}`) }}</p>
                <a v-if="report.photo" :href="report.photo" target="_blank" rel="noopener noreferrer">{{ t('crop-health.view-photo') }}</a>
              </div>
              <div class="report-actions">
                <pv-button outlined :label="t('crop-health.case.open')" @click="router.push(`/crop-health/reports/${report.id}`)"/>
                <template v-if="store.canDeleteReport(report.id)">
                  <template v-if="deletingId === report.id">
                    <span role="alert">{{ t('crop-health.delete-confirm') }}</span>
                    <pv-button severity="danger" :label="t('crop-health.delete-report')" :disabled="store.saving" @click="remove(report.id)"/>
                    <pv-button text :label="t('crop-health.cancel')" :disabled="store.saving" @click="deletingId = null"/>
                  </template>
                  <pv-button v-else outlined icon="pi pi-trash" :label="t('crop-health.delete-report')" :disabled="store.saving" @click="deletingId = report.id"/>
                </template>
                <pv-button v-if="store.canSchedule && report.status === 'PENDING'" :label="t('crop-health.schedule-inspection')"
                           @click="router.push({ path: '/crop-health/inspections', query: { reportId: report.id } })"/>
                <pv-button v-if="store.canPrescribe && report.status === 'INSPECTED'" outlined :label="t('crop-health.btn-prescribe')"
                           @click="router.push({ path: '/crop-health/prescribe', query: { reportId: report.id } })"/>
                <pv-button v-if="store.canAssess(report.id)" outlined :label="t('crop-health.advisor.evaluate')"
                           @click="router.push({ path: `/crop-health/reports/${report.id}`, hash: '#assessment' })"/>
              </div>
            </div>
          </template>
        </pv-card>
        <message-card v-if="reports.length === 0" icon="pi pi-inbox" :message="t('crop-health.advisor.no-results')"/>
      </div>
    </template>
  </div>
</template>

<style scoped>
.farmer-plot {
  max-width: 360px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
}

.filters .sa-field {
  flex: 1 1 180px;
}

.report-card {
  border: 1px solid var(--sa-outline-variant);
  border-left: 4px solid var(--sa-primary);
  border-radius: var(--sa-radius-card);
  box-shadow: none;
}

.report-card[data-status='PENDING'] {
  border-left-color: #b7791f;
}

.report-card[data-status='INSPECTED'] {
  border-left-color: #0369a1;
}

.report-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.report-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
  font-size: 18px;
  overflow-wrap: anywhere;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  background: var(--sa-surface-container-high);
  font-size: 12px;
  font-weight: 500;
}

.description {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.report-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  max-width: 400px;
}

@media (max-width: 700px) {
  .report-row {
    flex-direction: column;
    align-items: stretch;
  }

  .report-actions {
    max-width: none;
  }
}
</style>
