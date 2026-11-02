<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {formatNumber} from "../../../shared/presentation/format.js";
import {ExpenseCategory} from "../../domain/model/entities/expense-entry.entity.js";
import {EXPENSE_CATEGORY_ICONS} from "./ledger-summary-cards.vue";

/** `CostPerHectareReport` read model: cost of each category per hectare of the plot (Angular `CostPerHectareCard`). */
const props = defineProps({
  /** @type {import('../../domain/model/entities/campaign-ledger.entity.js').CampaignLedger} */
  ledger: { type: Object, required: true },
  /** Area of the plot, in hectares. */
  areaHectares: { type: Number, required: true }
});
const { t, locale } = useI18n();

/** Cost of each category per hectare of the plot (`CostPerHectareReport`). */
const report = computed(() => {
  const ledger = props.ledger;
  const areaHectares = props.areaHectares;
  return {
    areaHectares,
    hasArea: areaHectares > 0,
    rows: Object.values(ExpenseCategory).map(category => ({
      category,
      total: ledger.totalByCategory(category),
      perHectare: ledger.costPerHectare(areaHectares, category),
      percentage: ledger.percentageByCategory(category)
    })),
    totalPerHectare: ledger.costPerHectare(areaHectares),
    yieldPerHectare: ledger.yieldPerHectare(areaHectares),
    yieldUnit: ledger.yieldUnit
  };
});
</script>

<template>
  <pv-card class="report-card sa-card h-full">
    <template #title>
      <span class="flex align-items-center gap-3 text-lg">
        <i class="pi pi-th-large text-3xl title-icon" aria-hidden="true"/>{{ t('field-management.reports.cost-per-hectare') }}
      </span>
    </template>
    <template #subtitle>{{ t('field-management.reports.area', { area: formatNumber(report.areaHectares, locale) }) }}</template>
    <template #content>
      <template v-if="report.hasArea">
        <p class="total">
          {{ report.totalPerHectare.format() }}
          <span>{{ t('field-management.reports.per-hectare') }}</span>
        </p>

        <ul class="rows">
          <li v-for="row in report.rows" :key="row.category">
            <div class="row-head">
              <span class="category">
                <i :class="EXPENSE_CATEGORY_ICONS[row.category]" aria-hidden="true"/>
                {{ t(`field-management.expense-category.${row.category}`) }}
              </span>
              <span class="font-semibold">{{ row.perHectare.format() }}</span>
            </div>
            <pv-progress-bar :value="row.percentage" :show-value="false" style="height: 4px"
                             :aria-label="t(`field-management.expense-category.${row.category}`)"/>
            <span class="sa-muted text-sm">
              {{ t('field-management.finances.of-total', { percentage: formatNumber(row.percentage, locale, 0) }) }}
              · {{ row.total.format() }}
            </span>
          </li>
        </ul>

        <p class="yield">
          <i class="pi pi-chart-bar" aria-hidden="true"/>
          {{ t('field-management.reports.yield-per-hectare', {
            quantity: formatNumber(report.yieldPerHectare, locale, 1),
            unit: t(`field-management.yield-unit.${report.yieldUnit}`)
          }) }}
        </p>
      </template>
      <p v-else class="sa-muted">{{ t('field-management.reports.no-area') }}</p>
    </template>
  </pv-card>
</template>

<style scoped>
.report-card {
  min-width: 0;
}

.title-icon,
.category i,
.yield i {
  color: var(--sa-primary);
}

.total {
  margin: 16px 0;
  color: var(--sa-primary);
  font-size: 28px;
  font-weight: 700;
}

.total span {
  color: var(--sa-on-surface-variant);
  font-size: 14px;
  font-weight: 400;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.row-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.category {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.yield {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 24px 0 0;
}
</style>
