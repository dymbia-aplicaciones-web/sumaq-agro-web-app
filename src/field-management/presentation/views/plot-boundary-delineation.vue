<script setup>
import {computed, nextTick, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import useFieldManagementStore from "../../application/field-management.store.js";
import {DelineatePlotBoundaryCommand} from "../../domain/model/commands/delineate-plot-boundary.command.js";
import PageHeader from "../../../shared/presentation/components/page-header.vue";
import MessageCard from "../../../shared/presentation/components/message-card.vue";
import RegistrationSteps from "../components/registration-steps.vue";
import PlotBoundaryMap, {isSimplePolygon, MINIMUM_VERTICES, polygonAreaHectares} from "../components/plot-boundary-map.vue";
import BoundarySummaryPanel from "../components/boundary-summary-panel.vue";
import PlotSavedDialog from "../components/plot-saved-dialog.vue";

/** Step 2 of 2: the producer marks the corners of the plot on the map (Angular `PlotBoundaryMapView`, US-29, US-30). */
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useFieldManagementStore();
const boundaryMap = ref();
let loadedPlotId = null;

/** ID taken from the route `plots/:id/boundary`. */
const plotId = computed(() => Number(route.params.id));
const plot = computed(() => store.getPlotById(plotId.value));
const campaign = computed(() => store.getCurrentCampaignOf(plotId.value));

/** Title, e.g. "Pampa Alta (Papa Yungay)". */
const plotTitle = computed(() => {
  const variety = campaign.value?.seedVariety;
  return `${plot.value?.name ?? ''}${variety ? ` (${variety})` : ''}`;
});

const breadcrumbs = [
  { label: 'option.my-plot', link: '/field-management/dashboard' },
  { label: 'field-management.plots.manage', link: '/field-management/plots' },
  { label: 'field-management.steps.crop-data' },
  { label: 'field-management.steps.map-title' }
];

/** Corners marked so far, in order. */
const markedCoordinates = ref([]);

/** Area of the polygon, in hectares (US-29). */
const areaHectares = computed(() => polygonAreaHectares(markedCoordinates.value));

/** OPEN: fewer than 3 corners, CROSSED: sides cross, CLOSED: ready to save. */
const polygonStatus = computed(() => {
  if (markedCoordinates.value.length < MINIMUM_VERTICES) return 'OPEN';
  return isSimplePolygon(markedCoordinates.value) ? 'CLOSED' : 'CROSSED';
});

/** Plot saved, shown in the success dialog. */
const savedPlot = ref(null);
const dialogVisible = ref(false);

// Show the saved polygon once the plot arrives from the store.
watch(plot, async value => {
  if (!value || loadedPlotId === value.id) return;
  loadedPlotId = value.id;
  markedCoordinates.value = [...value.boundary];
  await nextTick();
  boundaryMap.value?.fitTo(value.boundary);
}, { immediate: true });

/** @param {import('../../domain/model/entities/field-plot.entity.js').GeoCoordinate} coordinate - New corner. */
const onAddVertex = (coordinate) => markedCoordinates.value = [...markedCoordinates.value, coordinate];
const onUndo = () => markedCoordinates.value = markedCoordinates.value.slice(0, -1);
const onClear = () => markedCoordinates.value = [];

/** Saves the polygon, which starts the satellite monitoring. */
const onSavePlot = () => {
  if (polygonStatus.value !== 'CLOSED') return;
  store.delineateBoundary(new DelineatePlotBoundaryCommand({
    plotId: plotId.value,
    coordinates: markedCoordinates.value,
    areaHectares: areaHectares.value
  }), saved => {
    savedPlot.value = saved;
    dialogVisible.value = true;
  });
};

/**
 * Goes where the producer chooses after the success dialog.
 * @param {'crop-health'|'plots'} result - Option chosen in the dialog.
 */
const onDialogClose = (result) => router.push(result === 'crop-health' ? '/crop-health/monitoring' : '/field-management/plots');
</script>

<template>
  <div class="page">
    <pv-progress-bar v-if="store.loading" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>
    <page-header :breadcrumbs="breadcrumbs" :title="`${t('field-management.boundary.title')}: ${plotTitle}`"
                 :subtitle="t('field-management.boundary.subtitle')" compact/>
    <registration-steps :current="2"/>

    <message-card v-if="store.error" icon="pi pi-times-circle" :message="t(store.error)" alert/>

    <div class="map-layout">
      <!-- Satellite map (US-30) -->
      <plot-boundary-map ref="boundaryMap" :coordinates="markedCoordinates" :status="polygonStatus" @vertex-added="onAddVertex"/>
      <!-- Delineation summary (US-29) -->
      <boundary-summary-panel
          :plot="plot" :campaign="campaign" :coordinates="markedCoordinates" :area-hectares="areaHectares"
          :status="polygonStatus" :saving="store.loading" @undo="onUndo" @clear="onClear" @save="onSavePlot"/>
    </div>

    <plot-saved-dialog
        v-if="savedPlot" v-model:visible="dialogVisible" :plot="savedPlot" :seed-variety="campaign?.seedVariety"
        :plot-count="store.plotCount" :plot-quota="store.plotQuota" @close="onDialogClose"/>
  </div>
</template>

<style scoped>
.map-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  align-items: start;
  gap: 24px;
}

@media (max-width: 959.98px) {
  .map-layout {
    grid-template-columns: 1fr;
  }
}
</style>
