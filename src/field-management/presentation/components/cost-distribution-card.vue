<script setup>
import "../../../shared/presentation/charts.js";
import {computed} from "vue";
import {Doughnut} from "vue-chartjs";
import {useI18n} from "vue-i18n";
import {formatCurrency, formatDate, formatNumber} from "../../../shared/presentation/format.js";
import {ExpenseCategory} from "../../domain/model/entities/expense-entry.entity.js";

/** Share of inputs, labor and freight in the investment (Angular `CostDistributionCard`). */
const props = defineProps({
  ledger: { type: Object, default: null }
});
const { t, locale } = useI18n();

/** Primary, tertiary and tertiary-fixed-dim of the theme. */
const colors = ['#006e1c', '#006874', '#4fd8eb'];

const categories = computed(() => props.ledger
    ? Object.values(ExpenseCategory).map(category => ({
      label: `field-management.expense-category.${category}`,
      amount: props.ledger.totalByCategory(category),
      percentage: props.ledger.percentageByCategory(category)
    }))
    : []);

/** Date of the oldest expense. */
const since = computed(() => props.ledger?.expenseHistory().at(-1)?.expenseDate ?? null);

const chartData = computed(() => {
  if (!props.ledger || props.ledger.totalInvestment().amount === 0) return null;
  return {
    labels: categories.value.map(item => t(item.label)),
    datasets: [{ data: categories.value.map(item => item.amount.amount), backgroundColor: colors, hoverBackgroundColor: colors, borderWidth: 0 }]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: item => ` ${formatCurrency(item.parsed)}` } } }
};
</script>

<template>
  <pv-card class="cost-card sa-card h-full">
    <template #title>
      <span class="flex align-items-center gap-3 text-lg"><i class="pi pi-chart-pie text-2xl" aria-hidden="true"/>{{ t('field-management.dashboard.cost-distribution') }}</span>
    </template>
    <template v-if="since" #subtitle>{{ t('field-management.dashboard.since') }} {{ formatDate(since, locale, { dateStyle: 'long' }) }}</template>
    <template #content>
      <pv-divider/>
      <div v-if="chartData" class="cost-body">
        <div class="doughnut" role="img" :aria-label="t('field-management.dashboard.cost-distribution')">
          <Doughnut :data="chartData" :options="chartOptions"/>
        </div>
        <ul class="legend" :aria-label="t('field-management.dashboard.cost-distribution')">
          <li v-for="(item, index) in categories" :key="item.label">
            <div class="flex align-items-center gap-3 py-2">
              <span class="dot" :style="{ background: colors[index] }" aria-hidden="true"/>
              <span class="flex flex-column flex-1">
                <strong class="font-medium">{{ t(item.label) }}</strong>
                <span class="sa-muted">{{ item.amount.format() }}</span>
              </span>
              <span class="text-lg font-medium">{{ formatNumber(item.percentage, locale, 0) }}%</span>
            </div>
            <pv-progress-bar :value="item.percentage" :show-value="false" style="height: 4px" class="mb-3"
                             :aria-label="t(item.label)" :pt="{ value: { style: { background: colors[index] } } }"/>
          </li>
        </ul>
      </div>
      <p v-else class="sa-muted mt-3">{{ t('field-management.dashboard.no-expenses') }}</p>
    </template>
  </pv-card>
</template>

<style scoped>
.cost-card {
  container-type: inline-size;
}

.cost-body {
  display: grid;
  gap: 16px;
  padding-top: 16px;
}

/* Doughnut and legend side by side when the card is wide enough. */
@container (min-width: 480px) {
  .cost-body {
    grid-template-columns: 200px 1fr;
    align-items: center;
  }
}

.doughnut {
  position: relative;
  height: 200px;
  min-width: 0;
}

.legend {
  margin: 0;
  padding: 0;
  list-style: none;
}

.dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}
</style>
