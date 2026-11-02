<script setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {formatNumber} from "../../../shared/presentation/format.js";

/** Card of one registered plot: status, crop, area and location (Angular `PlotCard`, US-28). */
const props = defineProps({
  /** @type {import('../../domain/model/entities/field-plot.entity.js').FieldPlot} The plot shown in the card. */
  plot: { type: Object, required: true },
  /** @type {import('../../domain/model/entities/crop-campaign.entity.js').CropCampaign} Current campaign of the plot, if it has one. */
  campaign: { type: Object, default: null },
  /** Position of the plot in the plan (1, 2, 3...). */
  position: { type: Number, required: true },
  /** Prevents overlapping plot mutations or deletion before ownership has loaded. */
  deletionDisabled: { type: Boolean, default: false }
});
const emit = defineEmits(['view-on-dashboard', 'view-monitoring', 'delineate', 'view-detail', 'record-soil', 'remove']);

const { t, locale } = useI18n();
const menu = ref();
const menuItems = computed(() => [
  { label: 'field-management.plots.view-on-dashboard', icon: 'pi pi-home', command: () => emit('view-on-dashboard', props.plot) },
  { label: 'field-management.plots.view-detail', icon: 'pi pi-map', command: () => emit('view-detail', props.plot) },
  { label: 'field-management.soil.title', icon: 'pi pi-list-check', command: () => emit('record-soil', props.plot) },
  { label: 'field-management.plots.delineate', icon: 'pi pi-pencil', command: () => emit('delineate', props.plot) },
  { label: 'common.delete', icon: 'pi pi-trash', disabled: props.deletionDisabled, command: () => emit('remove', props.plot) }
]);
</script>

<template>
  <pv-card class="plot-card sa-dark-card">
    <template #title>
      <div class="flex align-items-center">
        <span class="plot-number">{{ t('field-management.plots.plot-number', { number: position }) }}</span>
        <pv-button icon="pi pi-ellipsis-v" text rounded class="plot-menu" :aria-label="t('common.actions')" aria-haspopup="true" @click="menu.toggle($event)"/>
        <pv-menu ref="menu" :model="menuItems" popup>
          <template #item="{ item, props: itemProps }">
            <a v-bind="itemProps.action"><i :class="item.icon"/><span>{{ t(item.label) }}</span></a>
          </template>
        </pv-menu>
      </div>
    </template>
    <template #content>
      <span class="sa-chip">
        <i :class="plot.isMonitored() ? 'pi pi-sun' : 'pi pi-clock'" aria-hidden="true"/>
        {{ t(`field-management.plot-status.${plot.status}`) }}
      </span>
      <h2 class="plot-name">{{ plot.name }}</h2>
      <pv-divider class="plot-divider"/>
      <dl class="plot-data">
        <dt>{{ t('field-management.plots.crop') }}:</dt>
        <dd>{{ campaign?.seedVariety ?? t('field-management.plots.no-campaign') }}</dd>
        <dt>{{ t('field-management.plots.area') }}:</dt>
        <dd>{{ formatNumber(plot.areaHectares, locale) }} {{ t('field-management.plots.hectares') }}</dd>
        <dt>{{ t('field-management.plots.location') }}:</dt>
        <dd>{{ plot.region }}</dd>
      </dl>
    </template>
    <template #footer>
      <pv-button v-if="plot.isMonitored()" class="card-action" icon="pi pi-arrow-right" icon-pos="right"
                 :label="t('field-management.plots.view-monitoring')" @click="emit('view-monitoring', plot)"/>
      <pv-button v-else class="card-action" icon="pi pi-arrow-right" icon-pos="right"
                 :label="t('field-management.plots.delineate')" @click="emit('delineate', plot)"/>
    </template>
  </pv-card>
</template>

<style scoped>
.plot-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 300px;
  min-width: 0;
}

.plot-card :deep(.p-card-body),
.plot-card :deep(.p-card-content) {
  flex: 1;
}

.plot-number {
  color: var(--sa-on-tertiary);
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
}

.plot-menu.p-button {
  margin-left: auto;
  color: var(--sa-on-tertiary);
}

.plot-name {
  margin: 12px 0;
  font-size: 22px;
  font-weight: 600;
}

.plot-divider {
  --p-divider-border-color: color-mix(in srgb, var(--sa-on-tertiary) 40%, transparent);
}

.plot-data {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  margin: 16px 0 0;
}

.plot-data dt {
  font-weight: 600;
}

.plot-data dd {
  margin: 0;
}

.card-action.p-button {
  width: 100%;
  border-color: var(--sa-surface);
  border-radius: 9999px;
  background: var(--sa-surface);
  color: var(--sa-on-surface);
}
</style>
