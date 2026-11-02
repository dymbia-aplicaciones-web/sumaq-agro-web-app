<script setup>
import {computed, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useIamStore from "../../../iam/application/iam.store.js";
import useCropHealthStore from "../../../crop-health/application/crop-health.store.js";
import useFieldManagementStore from "../../application/field-management.store.js";
import PageHeader from "../../../shared/presentation/components/page-header.vue";
import MessageCard from "../../../shared/presentation/components/message-card.vue";
import CampaignKpiCards from "../components/campaign-kpi-cards.vue";
import NdviChartCard from "../components/ndvi-chart-card.vue";
import CostDistributionCard from "../components/cost-distribution-card.vue";

/** "My Plot": start page of the producer with costs, breakeven price and NDVI (Angular `MyPlotDashboardView`, US-16 to US-19). */
const { t } = useI18n();
const router = useRouter();
const iamStore = useIamStore();
const store = useFieldManagementStore();
const cropHealthStore = useCropHealthStore();

// NDVI of the selected plot: Crop Health loads it (both contexts share the selected plot).
/** Satellite observations of the selected plot, oldest first. */
const observations = computed(() => [...cropHealthStore.observations].reverse());
const latestObservation = computed(() => observations.value.at(-1));
const observationsError = computed(() => !!cropHealthStore.observationsError);

const breadcrumbs = [{ label: 'option.my-plot' }];

/** Name for the greeting; for an email, only the part before '@' so it fits on a phone. */
const userName = computed(() => {
  const name = iamStore.currentUser?.displayName ?? '';
  const at = name.indexOf('@');
  return at > 0 ? name.slice(0, at) : name;
});

/** Greeting by time of day: morning, afternoon or evening. */
const greetingKey = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return 'field-management.dashboard.good-morning';
  if (hour < 19) return 'field-management.dashboard.good-afternoon';
  return 'field-management.dashboard.good-evening';
});

/** Subtitle, e.g. "Pampa Alta – Papa Yungay (2.5 Ha)". */
const plotSummary = computed(() => {
  const plot = store.selectedPlot;
  if (!plot) return '';
  const variety = store.activeCampaign?.seedVariety;
  const area = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(plot.areaHectares);
  return `${plot.name}${variety ? ` – ${variety}` : ''} (${area} Ha)`;
});

const subtitle = computed(() => store.activeCampaign
    ? `${plotSummary.value} | ${t('field-management.dashboard.campaign')} ${store.activeCampaign.season}`
    : plotSummary.value);

watch(() => cropHealthStore.selectedPlot, plot => { if (plot) cropHealthStore.loadObservations(plot.id); }, { immediate: true });

/** Loads the plots again after an error. */
const retry = () => {
  const userId = store.currentUserId;
  if (userId !== null) store.loadMyPlots(userId);
};
</script>

<template>
  <div class="page">
    <pv-progress-bar v-if="store.loading" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>

    <page-header :breadcrumbs="breadcrumbs" :title="t(greetingKey, { name: userName })" :subtitle="subtitle">
      <div class="header-actions">
        <pv-button outlined class="sa-pill header-action" icon="pi pi-calendar" :label="t('field-management.campaigns.title')"
                   @click="router.push('/field-management/campaigns')"/>
        <pv-button class="sa-pill header-action" icon="pi pi-th-large" :label="t('field-management.dashboard.view-all-plots')"
                   @click="router.push('/field-management/plots')"/>
      </div>
    </page-header>

    <message-card v-if="store.error" icon="pi pi-cloud" :message="t('field-management.dashboard.load-error')" alert>
      <template #actions>
        <pv-button text icon="pi pi-refresh" :label="t('common.retry')" @click="retry"/>
      </template>
    </message-card>

    <message-card v-else-if="!store.loading && store.plots.length === 0" icon="pi pi-sun" :message="t('field-management.dashboard.no-plots')">
      <template #actions>
        <pv-button icon="pi pi-plus" :label="t('field-management.dashboard.register-plot')" @click="router.push('/field-management/plots/new')"/>
      </template>
    </message-card>

    <template v-else>
      <campaign-kpi-cards
          :campaign="store.activeCampaign"
          :ledger="store.ledger"
          :observation="latestObservation"
          :satellite-loading="cropHealthStore.observationsLoading"
          :satellite-error="observationsError"/>
      <section class="charts-grid">
        <ndvi-chart-card
            :observations="observations"
            :sowing-date="store.activeCampaign?.sowingDate"
            :loading="cropHealthStore.observationsLoading"
            :error="observationsError"/>
        <cost-distribution-card :ledger="store.ledger"/>
      </section>
    </template>
  </div>
</template>

<style scoped>
.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.header-action.p-button {
  height: 48px;
}

.charts-grid {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 24px;
}

.charts-grid > * {
  min-width: 0;
}

@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
