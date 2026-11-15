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
    <page-header :breadcrumbs="[{label: 'option.diagnosis-inbox', link: '/crop-health/inbox'}, {label: 'crop-health.alerts-title'}]"
                 :title="t('crop-health.alerts-title')" :subtitle="t('crop-health.alerts-description')"/>
    <section class="alert-toolbar">
      <plot-selector :plots="store.plots" :selected-plot-id="store.selectedPlot?.id ?? null" :disabled="store.scopeLoading"
                     @plot-selected="store.selectPlot"/>
      <span v-if="store.selectedPlot" class="region-chip">
        <i class="pi pi-map-marker" aria-hidden="true"/> {{ t('crop-health.region') }}:
        <strong>{{ store.selectedPlot.region }}</strong>
      </span>
    </section>

    <message-card v-if="store.alertsError" icon="pi pi-times-circle" :message="t(store.alertsError)" alert/>
    <div v-else-if="!store.alertsLoading && store.selectedPlot" class="alerts-list">
      <pv-card v-for="alert in store.alerts" :key="alert.id" class="alert-card" :class="alert.severity.toLowerCase()">
        <template #title>
          <div class="alert-heading">
            <span>{{ alert.title }}</span>
            <pv-tag class="alert-severity" rounded icon="pi pi-exclamation-triangle" :value="t('crop-health.alert-levels.' + alert.severity)"/>
          </div>
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
.alert-toolbar, .alert-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.alert-toolbar { padding: 20px 24px; background: white; border: 1px solid var(--sa-outline-variant); border-radius: 16px; }
.region-chip { padding: 8px 14px; border-radius: 999px; background: var(--sa-secondary-container); }
.alert-card { background: white; }
.alert-card.high, .alert-card.critical { border-left-color: #b83d00; }
.alert-card.medium { border-left-color: #ca7600; }
.alert-severity { background: #eef3e9; color: #235018; }
.high .alert-severity, .critical .alert-severity { background: #fff1e6; color: #a23400; }
.medium .alert-severity { background: #fff6df; color: #855000; }
.alert-card :deep(.p-card-content > p) { border-top: 1px solid var(--sa-outline-variant); padding-top: 14px; }
</style>
