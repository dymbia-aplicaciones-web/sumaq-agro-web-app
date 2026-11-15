<script setup>
import {watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useCropHealthStore from "../../application/crop-health.store.js";
import PageHeader from "../../../shared/presentation/components/page-header.vue";
import MessageCard from "../../../shared/presentation/components/message-card.vue";

/** Assigned plot directory, including plots without cases and producers outside cooperatives (Angular `AdvisorPlotsView`). */
const store = useCropHealthStore();
const router = useRouter();
const { t } = useI18n();

watch(() => store.scopeReady, ready => { if (ready) store.loadClinicalData(); }, { immediate: true });

/**
 * Counts all unresolved cases, including those awaiting farmer follow-up.
 * @param {number} plotId - Plot.
 * @returns {number} Unresolved cases of the plot.
 */
const pending = (plotId) => store.pestReports.filter(report => report.plotId === plotId && report.status !== 'RESOLVED').length;

/** @param {number} plotId - Plot to monitor. */
const monitor = (plotId) => {
  store.selectPlot(plotId);
  router.push('/crop-health/monitoring');
};
</script>

<template>
  <div class="page advisor-plots">
    <page-header :breadcrumbs="[{ label: 'option.diagnosis-inbox', link: '/crop-health/inbox' }, {label: 'crop-health.advisor.plots'}]" :title="t('crop-health.advisor.plots')" :subtitle="t('crop-health.advisor.scope-notice')"/>
    <nav class="flex flex-wrap gap-3">
      <pv-button text :label="t('crop-health.advisor.refresh')" :disabled="store.loading || store.saving" @click="store.retryScope()"/>
    </nav>
    <pv-progress-bar v-if="store.clinicalLoading" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>
    <message-card v-if="store.clinicalError" icon="pi pi-times-circle" :message="t(store.clinicalError)" alert/>

    <div v-if="!store.scopeLoading && !store.scopeError" class="plots">
      <pv-card v-for="plot in store.plots" :key="plot.id" class="sa-card">
        <template #title>{{ plot.name }}</template>
        <template #subtitle>{{ plot.region }}</template>
        <template #content>
          <p>{{ t('crop-health.advisor.producer') }}: {{ store.producerName(plot.ownerUserId) }} · #{{ plot.ownerUserId }}</p>
          <p>{{ t('crop-health.advisor.responsible') }}: {{ store.currentAdvisor?.name }}</p>
          <p>{{ t('crop-health.advisor.active') }}</p>
          <p v-if="!store.clinicalLoading && !store.clinicalError">{{ t('crop-health.advisor.pending') }}: {{ pending(plot.id) }}</p>
        </template>
        <template #footer>
          <div class="flex flex-wrap gap-2">
            <pv-button outlined :label="t('crop-health.advisor.view-work')"
                       @click="router.push({ path: '/crop-health/inbox', query: { plotId: plot.id } })"/>
            <pv-button text :label="t('crop-health.advisor.monitor')" @click="monitor(plot.id)"/>
          </div>
        </template>
      </pv-card>
      <p v-if="store.plots.length === 0" role="status">{{ t('crop-health.advisor.no-plots') }}</p>
    </div>
  </div>
</template>

<style scoped>
.advisor-plots {
  width: min(100%, 1100px);
  margin-inline: auto;
}

.plots {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
 .plots :deep(.p-card) { background: var(--sa-surface-container-low); }
.plots :deep(.p-card-title) { font-size: 1.35rem; font-weight: 500; }
.plots :deep(.p-card-subtitle) { color: inherit; font-weight: 600; }
.plots :deep(.p-card-footer .p-button) { border-radius: 999px; }
@media (max-width: 760px) { .plots { grid-template-columns: 1fr; } }
</style>
