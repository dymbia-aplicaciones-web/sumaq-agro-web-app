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
    <page-header :title="t('crop-health.advisor.plots')" :subtitle="t('crop-health.advisor.scope-notice')"/>
    <nav class="flex flex-wrap gap-3">
      <pv-button outlined class="sa-pill" :label="t('crop-health.inbox-title')" @click="router.push('/crop-health/inbox')"/>
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
  max-width: 1100px;
}

.plots {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: 16px;
}
</style>
