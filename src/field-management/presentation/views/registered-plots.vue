<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {useConfirm} from "primevue";
import useFieldManagementStore from "../../application/field-management.store.js";
import PageHeader from "../../../shared/presentation/components/page-header.vue";
import MessageCard from "../../../shared/presentation/components/message-card.vue";
import PlotQuotaSummary from "../components/plot-quota-summary.vue";
import PlotCard from "../components/plot-card.vue";
import PlotSlotCard from "../components/plot-slot-card.vue";

/** "My registered plots": one card per plot and one per free slot of the plan (Angular `RegisteredPlotsView`, US-22, US-28). */
const { t } = useI18n();
const router = useRouter();
const confirm = useConfirm();
const store = useFieldManagementStore();

const breadcrumbs = [
  { label: 'option.my-plot', link: '/field-management/dashboard' },
  { label: 'field-management.plots.manage' }
];

/** Free slot numbers are shown only after the current producer quota has loaded. */
const freeSlots = computed(() => !store.canRegisterPlot
    ? []
    : Array.from({ length: Math.max(store.plotQuota - store.plotCount, 0) }, (_, index) => store.plotCount + index + 1));

/** Current campaign of each plot, by plot ID. */
const campaigns = computed(() => new Map(store.plots.map(plot => [plot.id, store.getCurrentCampaignOf(plot.id)])));

const onRegisterNewPlot = () => {
  if (!store.canRegisterPlot) return;
  router.push('/field-management/plots/new');
};

/** @param {Object} plot - Plot to show on the dashboard. */
const onSelectPlot = (plot) => {
  store.selectPlot(plot.id);
  router.push('/field-management/dashboard');
};

/** @param {Object} plot - Plot whose satellite monitoring is opened. */
const onViewMonitoring = (plot) => {
  store.selectPlot(plot.id);
  router.push('/crop-health/monitoring');
};

/** @param {Object} plot - Plot to delineate. */
const onDelineate = (plot) => router.push(`/field-management/plots/${plot.id}/boundary`);

/** @param {Object} plot - Plot whose map and cadastral data are shown. */
const onViewDetail = (plot) => router.push(`/field-management/plots/${plot.id}`);

/** @param {Object} plot - Plot whose soil analysis is recorded. */
const onRecordSoil = (plot) => router.push(`/field-management/plots/${plot.id}/soil`);

/**
 * Deletes the plot only if the producer confirms.
 * @param {Object} plot - Plot to delete.
 */
const onDeletePlot = (plot) => {
  confirm.require({
    message: t('field-management.plots.delete-confirm', { name: plot.name }),
    header: t('common.delete'),
    icon: 'pi pi-exclamation-triangle',
    acceptProps: { label: t('common.delete'), severity: 'danger' },
    rejectProps: { label: t('common.cancel'), severity: 'secondary', outlined: true },
    accept: () => store.deletePlot(plot.id)
  });
};
</script>

<template>
  <div class="page">
    <pv-progress-bar v-if="store.loading" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>

    <page-header
        :breadcrumbs="breadcrumbs"
        :title="t('field-management.plots.title')"
        :subtitle="t(store.plotQuotaReady ? 'field-management.plots.subtitle' : 'field-management.plots.quota-checking',
                     { used: store.plotCount, quota: store.plotQuota })"/>

    <plot-quota-summary/>

    <message-card v-if="store.error" icon="pi pi-times-circle" :message="t(store.error)" alert/>

    <section class="plot-grid" :aria-label="t('field-management.plots.title')">
      <!-- Registered plots (US-28) -->
      <plot-card
          v-for="(plot, index) in store.plots"
          :key="plot.id"
          :plot="plot"
          :campaign="campaigns.get(plot.id)"
          :position="index + 1"
          :deletion-disabled="store.loading || !store.plotQuotaReady"
          @view-on-dashboard="onSelectPlot"
          @view-monitoring="onViewMonitoring"
          @delineate="onDelineate"
          @view-detail="onViewDetail"
          @record-soil="onRecordSoil"
          @remove="onDeletePlot"/>
      <!-- Free slots of the plan (US-22) -->
      <plot-slot-card v-for="number in freeSlots" :key="number" :position="number" @register="onRegisterNewPlot"/>
    </section>

    <pv-divider/>

    <pv-card class="plan-card sa-card">
      <template #title>
        <span class="flex align-items-center gap-3 text-base">
          <i class="pi pi-verified text-3xl plan-card__icon" aria-hidden="true"/>
          {{ t('field-management.plots.plan-title') }}
        </span>
      </template>
      <template #content>{{ t('field-management.plots.plan-text', { quota: store.plotQuota }) }}</template>
    </pv-card>
  </div>
</template>

<style scoped>
.plot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}

.plan-card {
  max-width: 560px;
  background: var(--sa-secondary-container);
  color: var(--sa-on-secondary-container);
}

.plan-card__icon {
  color: var(--sa-primary);
}
</style>
