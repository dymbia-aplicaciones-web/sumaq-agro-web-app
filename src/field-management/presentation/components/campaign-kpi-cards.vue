<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {formatDate, formatNumber} from "../../../shared/presentation/format.js";
import {ExpenseCategory} from "../../domain/model/entities/expense-entry.entity.js";

/** Leaf health, total spend and breakeven price of the campaign (Angular `CampaignKpiCards`, US-16 to US-19). */
const props = defineProps({
  campaign: { type: Object, default: null },
  ledger: { type: Object, default: null },
  observation: { type: Object, default: null },
  satelliteLoading: { type: Boolean, default: false },
  satelliteError: { type: Boolean, default: false }
});

const { t, locale } = useI18n();
const router = useRouter();

const categoryShares = computed(() => props.ledger
    ? Object.values(ExpenseCategory).map(category => ({
      label: `field-management.expense-category.${category}`,
      percentage: props.ledger.percentageByCategory(category)
    }))
    : []);
</script>

<template>
  <section class="kpi-grid" role="region" :aria-label="t('field-management.dashboard.summary')">
    <!-- Leaf health from the selected plot observations -->
    <pv-card class="kpi-card sa-dark-card">
      <template #title>
        <span class="kpi-title"><i class="pi pi-sun" aria-hidden="true"/>{{ t('field-management.dashboard.leaf-health') }}</span>
      </template>
      <template #content>
        <p v-if="satelliteLoading" class="kpi-note">{{ t('common.loading') }}</p>
        <p v-else-if="satelliteError" class="kpi-note" role="alert">{{ t('crop-health.errors.load-observations') }}</p>
        <template v-else-if="observation">
          <p class="kpi-value">{{ formatNumber(observation.ndviMean, locale, 2, 2) }} <span class="kpi-unit">NDVI</span></p>
          <p class="kpi-note">{{ t('crop-health.capture-date') }}: {{ formatDate(observation.date, locale) }}</p>
        </template>
        <p v-else class="kpi-note">{{ t('field-management.dashboard.leaf-health-pending') }}</p>
      </template>
      <template #footer>
        <pv-button class="kpi-action" icon="pi pi-map" :label="t('field-management.dashboard.view-satellite-map')" @click="router.push('/crop-health/monitoring')"/>
      </template>
    </pv-card>

    <!-- Total spend (US-16, US-17, US-19) -->
    <pv-card class="kpi-card sa-dark-card">
      <template #title>
        <span class="kpi-title">
          <i class="pi pi-dollar" aria-hidden="true"/>{{ t('field-management.dashboard.total-spend') }}
          <span v-if="campaign" class="sa-chip ml-auto">
            <i :class="campaign.isActive() ? 'pi pi-check-circle' : 'pi pi-lock'" aria-hidden="true"/>
            {{ t(`field-management.campaign-status.${campaign.status}`) }}
          </span>
        </span>
      </template>
      <template #content>
        <template v-if="ledger">
          <p class="kpi-label">{{ t('field-management.dashboard.total-invested') }}</p>
          <p class="kpi-value">{{ ledger.totalInvestment().format() }}</p>
          <p class="kpi-note">{{ categoryShares.map(share => `${t(share.label)}: ${formatNumber(share.percentage, locale, 0)}%`).join(' | ') }}</p>
        </template>
        <p v-else class="kpi-note">{{ t('field-management.dashboard.no-expenses') }}</p>
      </template>
      <template #footer>
        <pv-button class="kpi-action" icon="pi pi-receipt" :label="t('field-management.dashboard.view-expenses')" @click="router.push('/field-management/finances')"/>
      </template>
    </pv-card>

    <!-- Breakeven price (US-18) -->
    <pv-card class="kpi-card sa-dark-card">
      <template #title>
        <span class="kpi-title"><i class="pi pi-chart-line" aria-hidden="true"/>{{ t('field-management.dashboard.breakeven-title') }}</span>
      </template>
      <template #content>
        <template v-if="ledger && ledger.expectedYield > 0">
          <p class="kpi-label">{{ t('field-management.dashboard.breakeven-point') }}</p>
          <p class="kpi-value">
            {{ ledger.breakevenPrice().format() }}
            <span class="kpi-unit">{{ t(`field-management.yield-unit.per-${ledger.yieldUnit}`) }}</span>
          </p>
          <p class="kpi-note">
            {{ t('field-management.dashboard.estimated') }}: {{ formatNumber(ledger.expectedYield, locale) }}
            {{ t(`field-management.yield-unit.${ledger.yieldUnit}`) }}
          </p>
        </template>
        <p v-else-if="ledger" class="kpi-note">{{ t('field-management.dashboard.no-expected-yield') }}</p>
        <p v-else class="kpi-note">{{ t('field-management.dashboard.no-expenses') }}</p>
      </template>
      <template v-if="ledger && ledger.expectedYield > 0" #footer>
        <span v-tooltip.bottom="t('field-management.dashboard.minimum-price-hint')" class="sa-chip">
          <i class="pi pi-chart-line" aria-hidden="true"/>
          {{ t('field-management.dashboard.minimum-price', { price: ledger.suggestedPrice().format() }) }}
        </span>
      </template>
    </pv-card>
  </section>
</template>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

.kpi-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.kpi-card :deep(.p-card-body),
.kpi-card :deep(.p-card-content) {
  flex: 1;
}

.kpi-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  color: var(--sa-on-tertiary);
  font-size: 18px;
}

.kpi-title > i {
  font-size: 1.6rem;
}

.kpi-label {
  margin: 8px 0 0;
  font-weight: 500;
}

.kpi-value {
  margin: 0;
  color: var(--sa-tertiary-fixed-dim);
  font-size: 28px;
  font-weight: 600;
}

.kpi-unit {
  color: var(--sa-on-tertiary);
  font-size: 14px;
  font-weight: 400;
}

.kpi-note {
  margin: 4px 0 0;
  opacity: 0.9;
}

.kpi-action.p-button {
  border-color: var(--sa-surface);
  border-radius: 9999px;
  background: var(--sa-surface);
  color: var(--sa-on-surface);
}
</style>
