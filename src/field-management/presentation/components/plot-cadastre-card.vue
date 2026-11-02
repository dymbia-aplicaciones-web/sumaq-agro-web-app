<script setup>
import {useI18n} from "vue-i18n";
import {formatDate, formatNumber} from "../../../shared/presentation/format.js";

/** Cadastral data of a plot: area, region, vertices and AgroMonitoring link (Angular `PlotCadastreCard`). */
defineProps({
  /** @type {import('../../domain/model/entities/field-plot.entity.js').FieldPlot} */
  plot: { type: Object, required: true },
  /** @type {import('../../domain/model/entities/crop-campaign.entity.js').CropCampaign} Current campaign of the plot, if it has one. */
  campaign: { type: Object, default: null }
});
const { t, locale } = useI18n();
</script>

<template>
  <pv-card class="cadastre-card sa-card">
    <template #title>
      <!-- On phones the status chip moves below the title instead of overflowing the card. -->
      <div class="flex flex-wrap align-items-center gap-3">
        <i class="pi pi-map text-3xl title-icon" aria-hidden="true"/>
        <span class="text-lg">{{ t('field-management.plot-detail.cadastre') }}</span>
        <span class="sa-chip ml-auto" :class="{ muted: !plot.isMonitored() }">
          <i :class="plot.isMonitored() ? 'pi pi-globe' : 'pi pi-clock'" aria-hidden="true"/>
          {{ t(`field-management.plot-status.${plot.status}`) }}
        </span>
      </div>
    </template>
    <template #content>
      <dl class="data">
        <dt>{{ t('field-management.plots.location') }}</dt>
        <dd>{{ plot.region }}</dd>

        <dt>{{ t('field-management.plots.area') }}</dt>
        <dd>{{ formatNumber(plot.areaHectares, locale, 4) }} {{ t('field-management.plots.hectares') }}</dd>

        <dt>{{ t('field-management.plot-detail.vertices') }}</dt>
        <dd>{{ plot.boundary.length }}</dd>

        <dt>{{ t('field-management.plot-detail.agromonitoring') }}</dt>
        <dd class="code">{{ plot.agroMonitoringPolygonId ?? '—' }}</dd>

        <dt>{{ t('field-management.plots.crop') }}</dt>
        <dd>
          <template v-if="campaign">
            {{ t(`field-management.crop-type.${campaign.cropType}`) }} – {{ campaign.seedVariety }} ({{ campaign.season }})
          </template>
          <template v-else>{{ t('field-management.plots.no-campaign') }}</template>
        </dd>

        <template v-if="campaign?.sowingDate">
          <dt>{{ t('field-management.campaigns.sowing-date') }}</dt>
          <dd>{{ formatDate(campaign.sowingDate, locale) }}</dd>
        </template>
      </dl>

      <details v-if="plot.hasPolygon()" class="vertices">
        <summary>{{ t('field-management.boundary.coordinates') }}</summary>
        <ol>
          <li v-for="(vertex, index) in plot.boundary" :key="index">
            {{ formatNumber(vertex.latitude, locale, 5, 5) }}, {{ formatNumber(vertex.longitude, locale, 5, 5) }}
          </li>
        </ol>
      </details>
    </template>
  </pv-card>
</template>

<style scoped>
.cadastre-card {
  min-width: 0;
}

.title-icon {
  color: var(--sa-primary);
}

.sa-chip.muted {
  background: var(--sa-surface-container-high);
  color: var(--sa-on-surface);
}

.data {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 16px;
  margin: 16px 0;
}

.data dt {
  font-weight: 600;
}

.data dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.code {
  font-family: monospace;
}

.vertices summary {
  color: var(--sa-primary);
  font-weight: 500;
  cursor: pointer;
}

.vertices ol {
  margin: 8px 0 0;
  font-family: monospace;
}
</style>
