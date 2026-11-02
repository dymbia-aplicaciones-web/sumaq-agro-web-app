<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import useFieldManagementStore from "../../application/field-management.store.js";
import PageHeader from "../../../shared/presentation/components/page-header.vue";
import MessageCard from "../../../shared/presentation/components/message-card.vue";
import PlotPolygonViewer from "../components/plot-polygon-viewer.vue";
import PlotCadastreCard from "../components/plot-cadastre-card.vue";
import SoilBaselineCard from "../components/soil-baseline-card.vue";
import FarmerAdvisoryPanel from "../../../profiles/presentation/components/farmer-advisory-panel.vue";

/**
 * Detail of a plot: satellite map with its polygon, cadastral data and soil
 * analysis (Angular `PlotDetailView`, `SatelliteMapAndCadastreViewer` read model).
 */
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useFieldManagementStore();

/** ID taken from the route `plots/:id`. */
const id = computed(() => Number(route.params.id));
const plot = computed(() => store.getPlotById(id.value));
const campaign = computed(() => store.getCurrentCampaignOf(id.value));

const breadcrumbs = [
  { label: 'option.my-plot', link: '/field-management/dashboard' },
  { label: 'field-management.plots.manage', link: '/field-management/plots' },
  { label: 'field-management.plot-detail.title' }
];

const onViewOnDashboard = () => {
  store.selectPlot(id.value);
  router.push('/field-management/dashboard');
};
</script>

<template>
  <div class="page">
    <pv-progress-bar v-if="store.loading" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>

    <page-header :breadcrumbs="breadcrumbs" :title="plot?.name ?? t('field-management.plot-detail.title')"
                 :subtitle="t('field-management.plot-detail.subtitle')">
      <div v-if="plot" class="header-actions">
        <pv-button outlined class="sa-pill" icon="pi pi-pencil" :label="t('field-management.plots.delineate')"
                   @click="router.push(`/field-management/plots/${id}/boundary`)"/>
        <pv-button class="sa-pill" icon="pi pi-home" :label="t('field-management.plots.view-on-dashboard')" @click="onViewOnDashboard"/>
      </div>
    </page-header>

    <message-card v-if="store.error" icon="pi pi-times-circle" :message="t(store.error)" alert/>

    <div v-if="plot" class="detail-grid">
      <plot-polygon-viewer :coordinates="plot.boundary"/>
      <div class="side">
        <farmer-advisory-panel :plot-id="id"/>
        <plot-cadastre-card :plot="plot" :campaign="campaign"/>
        <soil-baseline-card :soil-baseline="plot.soilBaseline" :crop-type="campaign?.cropType"
                            :record-link="`/field-management/plots/${id}/soil`"/>
      </div>
    </div>
    <message-card v-else-if="!store.plotsLoading" icon="pi pi-search" :message="t('field-management.plot-detail.not-found')">
      <template #actions>
        <pv-button :label="t('field-management.finances.select-plot')" @click="router.push('/field-management/plots')"/>
      </template>
    </message-card>
  </div>
</template>

<style scoped>
.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr);
  align-items: start;
  gap: 24px;
}

.side {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

@media (max-width: 1024px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
