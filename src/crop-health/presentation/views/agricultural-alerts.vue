<script setup>
import {watch} from "vue";
import {useI18n} from "vue-i18n";
import useCropHealthStore from "../../application/crop-health.store.js";
import PageHeader from "../../../shared/presentation/components/page-header.vue";
import MessageCard from "../../../shared/presentation/components/message-card.vue";
import PlotSelector from "../components/plot-selector.vue";
import {formatDate} from "../../../shared/presentation/format.js";

/**
 * Agroclimatic alerts of the region of the selected plot (Angular `AgriculturalAlertsView`).
 * Severity levels are reflected through CSS classes for visual distinction.
 */
const store = useCropHealthStore();
const { t, locale } = useI18n();

watch(() => store.selectedPlot, plot => { if (plot) store.loadAlerts(plot.region); }, { immediate: true });
</script>

<template>
  <div class="page">
    <pv-progress-bar v-if="store.alertsLoading" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>
    <page-header :eyebrow="t('crop-health.eyebrow')" :title="t('crop-health.alerts-title')" :subtitle="store.selectedPlot?.region ?? ''">
      <plot-selector :plots="store.plots" :selected-plot-id="store.selectedPlot?.id ?? null" :disabled="store.scopeLoading"
                     @plot-selected="store.selectPlot"/>
    </page-header>

    <message-card v-if="store.alertsError" icon="pi pi-times-circle" :message="t(store.alertsError)" alert/>
    <div v-else-if="!store.alertsLoading && store.selectedPlot" class="alerts-list">
      <pv-card v-for="alert in store.alerts" :key="alert.id" class="alert-card" :class="alert.severity.toLowerCase()">
        <template #title>
          <span class="flex align-items-center gap-3 text-lg"><i class="pi pi-exclamation-triangle text-2xl" aria-hidden="true"/>{{ alert.title }}</span>
        </template>
        <template #subtitle>{{ formatDate(alert.issuedAt, locale) }} · {{ alert.source }}</template>
        <template #content>
          <p class="mt-0">{{ alert.description }}</p>
          <p class="region-row"><i class="pi pi-map-marker" aria-hidden="true"/>{{ t('crop-health.region') }}: {{ alert.region }}</p>
        </template>
      </pv-card>
      <message-card v-if="store.alerts.length === 0" icon="pi pi-check-circle" :message="t('crop-health.no-alerts')"/>
    </div>
    <p v-if="!store.alertsLoading && !store.alertsError && !store.selectedPlot">{{ t('crop-health.no-plots') }}</p>
  </div>
</template>

<style scoped>
.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Severity left-border accent */
.alert-card {
  border: 1px solid var(--sa-outline-variant);
  border-left: 5px solid var(--sa-outline-variant);
  border-radius: var(--sa-radius-card);
  box-shadow: none;
}

.alert-card.high,
.alert-card.critical {
  border-left-color: var(--sa-error);
}

.alert-card.medium {
  border-left-color: var(--sa-tertiary);
}

.alert-card.low {
  border-left-color: var(--sa-primary);
}

.region-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  color: var(--sa-on-surface-variant);
  font-weight: 500;
}
</style>
