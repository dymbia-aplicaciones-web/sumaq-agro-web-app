<script setup>
import L from "leaflet";
import {nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {useToast} from "primevue";
import useCropHealthStore from "../../application/crop-health.store.js";
import PageHeader from "../../../shared/presentation/components/page-header.vue";
import MessageCard from "../../../shared/presentation/components/message-card.vue";
import PlotSelector from "../components/plot-selector.vue";
import {observationImage} from "../utils/observation-image.js";
import {createBaseLayers, PERU_VIEW, showBaseLayer} from "../../../shared/presentation/map-layers.js";
import {formatDate, formatNumber, intlLocale} from "../../../shared/presentation/format.js";

/** Multispectral satellite viewer of a plot (Angular `CropHealthView`). */
const store = useCropHealthStore();
const router = useRouter();
const toast = useToast();
const { t, locale } = useI18n();

const mapContainer = ref();
const selectedBase = ref('satellite');
const selectedLayer = ref('ndvi');
const exportingImage = ref(false);
const baseOptions = [
  { value: 'satellite', label: 'crop-health.hybrid-satellite' },
  { value: 'streets', label: 'crop-health.street-map' }
];
const baseLayers = createBaseLayers();
let map;
let sectorLayer;

/** Draws the polygon of the selected plot with the color of the active layer. */
const drawSector = () => {
  if (!map) return;
  if (sectorLayer) { map.removeLayer(sectorLayer); sectorLayer = undefined; }
  const plot = store.selectedPlot;
  if (!plot?.hasPolygon()) { map.setView(PERU_VIEW.center, PERU_VIEW.zoom); return; }
  const color = selectedLayer.value === 'ndvi' ? '#16803c' : '#0369a1';
  const vertices = plot.boundary.map(vertex => [vertex.latitude, vertex.longitude]);
  const outline = L.polygon(vertices, { color: '#ffffff', weight: 7, opacity: 0.95, fill: false, interactive: false });
  const polygon = L.polygon(vertices, { color, weight: 3, opacity: 1, fillColor: color, fillOpacity: 0.16, lineJoin: 'round' });
  polygon.bindTooltip(`${plot.name} · ${plot.areaHectares.toFixed(2)} ha`, { sticky: true });
  const corners = vertices.map(vertex => L.circleMarker(vertex, { radius: 4, color: '#ffffff', weight: 2, fillColor: color, fillOpacity: 1, interactive: false }));
  sectorLayer = L.layerGroup([outline, polygon, ...corners]).addTo(map);
  map.invalidateSize();
  map.fitBounds(polygon.getBounds(), { padding: [64, 64], maxZoom: 18 });
};

onMounted(() => {
  map = L.map(mapContainer.value, { zoomSnap: 0.25 }).setView(PERU_VIEW.center, PERU_VIEW.zoom);
  showBaseLayer(map, baseLayers, selectedBase.value);
  nextTick(drawSector);
});

onBeforeUnmount(() => map?.remove());

watch(() => store.selectedPlot, plot => {
  if (plot) store.loadObservations(plot.id);
  nextTick(drawSector);
}, { immediate: true });
watch(selectedLayer, drawSector);
watch(selectedBase, value => map && showBaseLayer(map, baseLayers, value));

/** Downloads the PNG report of the latest observation. */
const downloadImage = async () => {
  const plot = store.selectedPlot;
  const observation = store.latestObservation;
  if (!plot || !observation || exportingImage.value || store.observationsLoading || store.observationsError) return;
  exportingImage.value = true;
  try {
    const keys = { title: 'image-title', plot: 'plot', capture: 'capture-date', area: 'plot-area', stress: 'stress-detected',
      clouds: 'cloud-coverage', temperature: 'surface-temperature', recommendation: 'recommendation', noData: 'no-data', footer: 'image-footer' };
    const labels = Object.fromEntries(Object.entries(keys).map(([key, value]) => [key, t(`crop-health.${value}`)]));
    const blob = await observationImage(plot, observation, labels, intlLocale(locale.value));
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sumaqagro-${plot.id}-${observation.date.slice(0, 10)}.png`;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  } catch {
    toast.add({ severity: 'error', summary: t('crop-health.image-error'), life: 6000 });
  } finally {
    exportingImage.value = false;
  }
};
</script>

<template>
  <div class="page">
    <pv-progress-bar v-if="store.observationsLoading" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>
    <page-header :eyebrow="t('crop-health.eyebrow')" :title="t('crop-health.viewer-title')"
                 :subtitle="store.selectedPlot ? `${store.selectedPlot.name} · ${store.selectedPlot.region}` : ''">
      <plot-selector :plots="store.plots" :selected-plot-id="store.selectedPlot?.id ?? null" :disabled="store.scopeLoading"
                     @plot-selected="store.selectPlot"/>
    </page-header>

    <message-card v-if="store.observationsError" icon="pi pi-times-circle" :message="t(store.observationsError)" alert/>
    <template v-else-if="!store.observationsLoading">
      <p v-if="!store.selectedPlot" role="status" class="m-0">{{ t('crop-health.no-plots') }}</p>
      <p v-else-if="!store.selectedPlot.hasPolygon()" role="status" class="m-0">{{ t('crop-health.no-polygon') }}</p>
      <p v-else-if="!store.latestObservation" role="status" class="m-0">{{ t('crop-health.no-observations') }}</p>
    </template>

    <div class="flex align-items-center gap-3" role="radiogroup" :aria-label="t('crop-health.layers')">
      <span class="font-medium layers-label">{{ t('crop-health.layers') }}</span>
      <label class="flex align-items-center gap-2"><pv-radio-button v-model="selectedLayer" value="ndvi" name="layer"/>NDVI</label>
      <label class="flex align-items-center gap-2"><pv-radio-button v-model="selectedLayer" value="ndwi" name="layer"/>NDWI</label>
    </div>
    <p class="m-0">{{ t('crop-health.map-boundary-note') }}</p>

    <div class="content-grid">
      <div class="map-card">
        <div ref="mapContainer" class="map"/>
        <div class="flex flex-wrap align-items-center justify-content-between gap-3 pt-3">
          <span class="flex align-items-center gap-2 text-sm sa-muted"><i class="pi pi-stop" aria-hidden="true"/>{{ t('crop-health.plot-boundary') }}</span>
          <pv-select-button v-model="selectedBase" :options="baseOptions" option-value="value" :allow-empty="false" :aria-label="t('crop-health.map-background')">
            <template #option="{ option }">{{ t(option.label) }}</template>
          </pv-select-button>
        </div>
      </div>

      <aside>
        <pv-card class="sa-card">
          <template #title>{{ t('crop-health.observation-values') }}</template>
          <template v-if="!store.observationsLoading && !store.observationsError && store.latestObservation" #subtitle>
            {{ t('crop-health.capture-date') }}: {{ formatDate(store.latestObservation.date, locale, { dateStyle: 'medium', timeStyle: 'short' }) }}
          </template>
          <template #content>
            <template v-if="!store.observationsLoading && !store.observationsError && store.latestObservation">
              <dl class="metrics">
                <dt>NDVI</dt><dd>{{ formatNumber(store.latestObservation.ndviMean, locale, 2, 2) }}</dd>
                <dt>NDWI</dt><dd>{{ formatNumber(store.latestObservation.ndwiMean, locale, 2, 2) }}</dd>
                <dt>{{ t('crop-health.stress-detected') }}</dt><dd>{{ formatNumber(store.latestObservation.stressAreaHectares, locale, 1, 1) }} ha</dd>
              </dl>
              <div v-if="store.latestObservation.recommendation" class="recommendation-box">
                <strong>{{ t('crop-health.recommendation') }}</strong>
                <p class="m-0">{{ store.latestObservation.recommendation }}</p>
              </div>
            </template>
            <template v-else>
              <dl class="metrics">
                <dt>NDVI</dt><dd>{{ t('crop-health.no-data') }}</dd>
                <dt>NDWI</dt><dd>{{ t('crop-health.no-data') }}</dd>
              </dl>
              <p>{{ t('crop-health.observation-pending') }}</p>
            </template>
          </template>
          <template #footer>
            <div class="flex flex-column gap-3">
              <pv-button class="sa-pill w-full" :label="t('crop-health.btn-consult')" @click="router.push('/crop-health/inbox')"/>
              <pv-button outlined class="sa-pill w-full" icon="pi pi-image" :label="t(exportingImage ? 'common.loading' : 'crop-health.download-image')"
                         :disabled="!store.latestObservation || store.observationsLoading || !!store.observationsError || exportingImage" @click="downloadImage"/>
            </div>
          </template>
        </pv-card>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.layers-label {
  color: var(--sa-primary);
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

.map-card {
  display: flex;
  flex-direction: column;
  min-height: 520px;
  padding: 24px;
  border: 1px solid var(--sa-outline-variant);
  border-radius: var(--sa-radius-large);
  background: var(--sa-surface-container-low);
}

.map {
  z-index: 0;
  flex: 1;
  min-height: 460px;
  border-radius: 16px;
  overflow: hidden;
}

.metrics {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4px 16px;
  margin: 16px 0;
  font-size: 16px;
}

.metrics dt {
  color: var(--sa-on-surface-variant);
}

.metrics dd {
  margin: 0;
  font-weight: 600;
  text-align: right;
}

.recommendation-box {
  margin-bottom: 8px;
  padding: 12px;
  border: 1px solid var(--sa-outline-variant);
  border-radius: 12px;
  background: var(--sa-surface-container-high);
}

.recommendation-box strong {
  display: block;
  margin-bottom: 6px;
  color: var(--sa-primary);
}

@media (max-width: 600px) {
  .map-card {
    min-height: 420px;
    padding: 12px;
  }

  .map {
    min-height: 360px;
  }
}
</style>
