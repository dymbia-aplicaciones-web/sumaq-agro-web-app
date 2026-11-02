<script setup>
import {useI18n} from "vue-i18n";
import useFieldManagementStore from "../../application/field-management.store.js";

/** Shared Seed-plan usage indicator; an unavailable count is never presented as free capacity (Angular `PlotQuotaSummary`). */
const { t } = useI18n();
const store = useFieldManagementStore();

/** Explicitly retries the current producer's quota query without changing accounts. */
const refresh = () => {
  const owner = store.currentUserId;
  if (owner !== null && !store.loading) store.loadMyPlots(owner);
};
</script>

<template>
  <section class="quota-summary" :aria-label="t('field-management.plots.plan-title')">
    <template v-if="store.plotQuotaReady">
      <p aria-live="polite">
        <strong>{{ t('field-management.plots.quota-usage', { used: store.plotCount, quota: store.plotQuota }) }}</strong>
      </p>
      <pv-progress-bar :value="(store.plotCount / store.plotQuota) * 100" :show-value="false" style="height: 4px"
                       :aria-label="t('field-management.plots.quota-usage', { used: store.plotCount, quota: store.plotQuota })"/>
      <p>{{ t('field-management.plots.quota-remaining', { remaining: store.remainingPlotSlots }) }}</p>
      <p>{{ t('field-management.plots.quota-counting') }}</p>
      <p v-if="store.plotQuotaReached" role="status">{{ t('field-management.plots.plan-full', { quota: store.plotQuota }) }}</p>
      <pv-button text :label="t('field-management.plots.quota-refresh')" :disabled="store.loading" @click="refresh"/>
    </template>
    <template v-else>
      <p role="status">{{ t(store.loading ? 'field-management.plots.quota-checking' : 'field-management.errors.quota-unavailable') }}</p>
      <pv-button v-if="!store.loading && store.currentUserId !== null" outlined :label="t('common.retry')" @click="refresh"/>
    </template>
  </section>
</template>

<style scoped>
.quota-summary {
  padding: 20px;
  border: 1px solid var(--sa-outline-variant);
  border-radius: 16px;
  background: var(--sa-surface-container-low);
}

p {
  margin: 0 0 12px;
}

.p-progressbar {
  margin-bottom: 12px;
}
</style>
