<script>
/** Minimum number of vertices of a polygon. */
export const MINIMUM_VERTICES = 3;

/**
 * Area of a GPS polygon in hectares, with the shoelace formula. The
 * coordinates are projected to meters around the center of the polygon,
 * which is precise enough for the size of a farm plot.
 * @param {import('../../domain/model/entities/field-plot.entity.js').GeoCoordinate[]} coordinates - Vertices of the polygon, in order.
 * @returns {number} Area in hectares.
 */
export function polygonAreaHectares(coordinates) {
  if (coordinates.length < MINIMUM_VERTICES) return 0;
  const meanLatitude = coordinates.reduce((sum, vertex) => sum + vertex.latitude, 0) / coordinates.length;
  const metersPerDegreeLatitude = 110_540;
  const metersPerDegreeLongitude = 111_320 * Math.cos((meanLatitude * Math.PI) / 180);
  const points = coordinates.map(vertex => ({
    x: vertex.longitude * metersPerDegreeLongitude,
    y: vertex.latitude * metersPerDegreeLatitude
  }));
  const doubleArea = points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + point.x * next.y - next.x * point.y;
  }, 0);
  return Math.abs(doubleArea) / 2 / 10_000;
}

/**
 * Tells whether the sides of a polygon do not cross each other (US-29).
 * @param {import('../../domain/model/entities/field-plot.entity.js').GeoCoordinate[]} coordinates - Vertices of the polygon, in order.
 * @returns {boolean} `true` for a simple polygon.
 */
export function isSimplePolygon(coordinates) {
  const total = coordinates.length;
  for (let i = 0; i < total; i++) {
    for (let j = i + 1; j < total; j++) {
      const adjacent = j === i + 1 || (i === 0 && j === total - 1);
      if (!adjacent && segmentsCross(coordinates[i], coordinates[(i + 1) % total], coordinates[j], coordinates[(j + 1) % total])) {
        return false;
      }
    }
  }
  return true;
}

/** `true` when the segment a-b crosses the segment c-d. */
function segmentsCross(a, b, c, d) {
  const orientation = (p, q, r) => Math.sign(
      (q.longitude - p.longitude) * (r.latitude - p.latitude) - (q.latitude - p.latitude) * (r.longitude - p.longitude));
  return orientation(a, b, c) * orientation(a, b, d) < 0 && orientation(c, d, a) * orientation(c, d, b) < 0;
}
</script>

<script setup>
import L from "leaflet";
import {onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {createBaseLayers, DEFAULT_MAP_CENTER, showBaseLayer} from "../../../shared/presentation/map-layers.js";
import {GeoCoordinate} from "../../domain/model/entities/field-plot.entity.js";

/** Satellite map (Leaflet) where the producer marks the corners of the plot (Angular `PlotBoundaryMap`, US-30). */
const props = defineProps({
  /** Vertices marked on the map, in order. */
  coordinates: { type: Array, required: true },
  /** Open, closed or crossed polygon (`OPEN`, `CLOSED` or `CROSSED`); a crossed one is drawn in red. */
  status: { type: String, required: true }
});
/** `vertex-added`: the producer marked a new corner. */
const emit = defineEmits(['vertex-added']);
const { t } = useI18n();

const mapElement = ref();
/** Base layer shown on the map. */
const layer = ref('satellite');
const layerOptions = ['satellite', 'streets'];
const search = ref('');
/** Message of the coordinate search or of the GPS location. */
const searchMessage = ref(null);
const baseLayers = createBaseLayers();
const drawingLayer = L.layerGroup();
let map;

/** Draws the polygon (red when the sides cross) and the V1, V2... labels. */
const drawPolygon = () => {
  drawingLayer.clearLayers();
  const points = props.coordinates.map(vertex => [vertex.latitude, vertex.longitude]);
  const color = props.status === 'CROSSED' ? '#e53935' : '#4caf50';
  if (points.length >= 2) {
    const shape = points.length >= MINIMUM_VERTICES
        ? L.polygon(points, { color, weight: 3, fillOpacity: 0.3 })
        : L.polyline(points, { color, weight: 3 });
    shape.addTo(drawingLayer);
  }
  points.forEach((point, index) =>
      L.circleMarker(point, { radius: 7, color: '#1b5e20', weight: 2, fillColor: '#ffffff', fillOpacity: 1 })
          .bindTooltip(`V${index + 1}`, { permanent: true, direction: 'top', offset: [0, -8], className: 'vertex-label' })
          .addTo(drawingLayer));
};

/**
 * Centers the map on the polygon (the view calls it after loading).
 * @param {GeoCoordinate[]} coordinates - Polygon vertices.
 */
const fitTo = (coordinates) => {
  if (!map || coordinates.length === 0) return;
  map.fitBounds(L.latLngBounds(coordinates.map(vertex => [vertex.latitude, vertex.longitude])), { padding: [48, 48], maxZoom: 18 });
};

/** Moves the map to coordinates typed as "latitude, longitude". */
const onSearch = () => {
  const parts = search.value.split(',').map(part => Number(part.trim()));
  const [latitude, longitude] = parts;
  const valid = parts.length === 2 && parts.every(part => Number.isFinite(part)) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
  if (!valid) {
    searchMessage.value = 'field-management.boundary.search-invalid';
    return;
  }
  searchMessage.value = null;
  map?.setView([latitude, longitude], 17);
};

/** Adds the phone's GPS location as a corner. */
const onUseMyLocation = () => {
  searchMessage.value = null;
  if (!navigator.geolocation) {
    searchMessage.value = 'field-management.boundary.location-unavailable';
    return;
  }
  navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        emit('vertex-added', new GeoCoordinate(coords.latitude, coords.longitude));
        map?.setView([coords.latitude, coords.longitude], 18);
      },
      () => searchMessage.value = 'field-management.boundary.location-denied',
      { enableHighAccuracy: true, timeout: 15000 });
};

onMounted(() => {
  map = L.map(mapElement.value, { center: DEFAULT_MAP_CENTER, zoom: 17 });
  drawingLayer.addTo(map);
  showBaseLayer(map, baseLayers, layer.value);
  map.on('click', event => emit('vertex-added', new GeoCoordinate(event.latlng.lat, event.latlng.lng)));
  drawPolygon();
  fitTo(props.coordinates);
  // Leaflet measures the container before the layout settles; measure again.
  setTimeout(() => map?.invalidateSize());
});

onBeforeUnmount(() => map?.remove());

// Redraw the polygon every time a vertex changes.
watch(() => [props.coordinates, props.status], drawPolygon);
// Change the base layer.
watch(layer, value => map && showBaseLayer(map, baseLayers, value));

defineExpose({ fitTo });
</script>

<template>
  <pv-card class="map-card sa-card">
    <template #content>
      <div class="map-toolbar">
        <pv-icon-field class="flex-1">
          <pv-input-icon class="pi pi-search"/>
          <pv-input-text v-model="search" fluid :placeholder="t('field-management.boundary.search')" :aria-label="t('field-management.boundary.search')" @keydown.enter.prevent="onSearch"/>
        </pv-icon-field>
        <pv-button outlined icon="pi pi-map-marker" :label="t('field-management.boundary.my-location')" @click="onUseMyLocation"/>
      </div>
      <p v-if="searchMessage" class="sa-error mx-3 mt-0" role="alert">{{ t(searchMessage) }}</p>

      <div ref="mapElement" class="map" role="application" :aria-label="t('field-management.boundary.map')"/>

      <div class="map-footer">
        <p class="flex align-items-center gap-2 m-0 sa-muted text-sm">
          <i class="pi pi-bullseye" aria-hidden="true"/>
          {{ t('field-management.boundary.instructions', { minimum: MINIMUM_VERTICES }) }}
        </p>
        <pv-select-button v-model="layer" :options="layerOptions" :allow-empty="false" :aria-label="t('field-management.boundary.layer')">
          <template #option="{ option }">{{ t(`field-management.boundary.layer-${option}`) }}</template>
        </pv-select-button>
      </div>
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

.map-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
}

.map {
  z-index: 0;
  height: min(62vh, 560px);
  min-height: 340px;
  cursor: crosshair;
}

.map-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
}

@media (max-width: 959.98px) {
  .map {
    height: 50vh;
  }

  .map-toolbar {
    flex-wrap: wrap;
  }
}
</style>
