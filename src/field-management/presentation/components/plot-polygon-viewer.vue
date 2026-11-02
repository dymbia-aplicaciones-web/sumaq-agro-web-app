<script setup>
import L from "leaflet";
import {onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {DEFAULT_MAP_CENTER} from "../../../shared/presentation/map-layers.js";

/**
 * Read-only satellite map with the polygon of a plot
 * (Angular `PlotPolygonViewer`, `SatelliteMapAndCadastreViewer` read model).
 */
const props = defineProps({
  /** @type {import('../../domain/model/entities/field-plot.entity.js').GeoCoordinate[]} Vertices of the polygon, in order. */
  coordinates: { type: Array, required: true }
});
const { t } = useI18n();

const mapElement = ref();
const polygonLayer = L.layerGroup();
let map;

/** Draws the polygon and centers the map on it. */
const draw = () => {
  if (!map) return;
  polygonLayer.clearLayers();
  if (props.coordinates.length < 3) return;
  const points = props.coordinates.map(vertex => [vertex.latitude, vertex.longitude]);
  const polygon = L.polygon(points, { color: '#4caf50', weight: 3, fillOpacity: 0.3 });
  polygon.addTo(polygonLayer);
  map.fitBounds(polygon.getBounds(), { padding: [32, 32], maxZoom: 18 });
};

onMounted(() => {
  map = L.map(mapElement.value, { center: DEFAULT_MAP_CENTER, zoom: 15, scrollWheelZoom: false });
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19, maxNativeZoom: 17, attribution: 'Tiles © Esri — Esri, Maxar, Earthstar Geographics'
  }).addTo(map);
  polygonLayer.addTo(map);
  draw();
  // Leaflet measures the container before the layout settles; measure again.
  setTimeout(() => map?.invalidateSize());
});

onBeforeUnmount(() => map?.remove());

watch(() => props.coordinates, draw);
</script>

<template>
  <pv-card class="map-card sa-card">
    <template #content>
      <div ref="mapElement" class="map" role="img" :aria-label="t('field-management.plot-detail.map')"/>
      <p v-if="coordinates.length < 3" class="sa-muted m-0 px-3 py-2">{{ t('field-management.plot-detail.no-polygon') }}</p>
    </template>
  </pv-card>
</template>

<style scoped>
.map-card {
  min-width: 0;
  overflow: hidden;
}

.map-card :deep(.p-card-body) {
  padding: 0;
}

.map {
  z-index: 0;
  height: min(50vh, 420px);
  min-height: 300px;
}
</style>
