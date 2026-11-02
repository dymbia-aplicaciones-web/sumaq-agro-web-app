<script>
import {ExpenseCategory} from "../../domain/model/entities/expense-entry.entity.js";

/** Icon of each expense category (Material `compost`, `engineering`, `local_shipping`). */
export const EXPENSE_CATEGORY_ICONS = Object.freeze({
  [ExpenseCategory.INPUTS]: 'pi pi-box',
  [ExpenseCategory.LABOR]: 'pi pi-users',
  [ExpenseCategory.FREIGHT]: 'pi pi-truck'
});
</script>

<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {formatNumber} from "../../../shared/presentation/format.js";

/** Total invested and the cost of each category of the campaign (Angular `LedgerSummaryCards`, US-36). */
const props = defineProps({
  /** @type {import('../../domain/model/entities/campaign-ledger.entity.js').CampaignLedger} */
  ledger: { type: Object, required: true }
});
const { t, locale } = useI18n();

const categories = computed(() => Object.values(ExpenseCategory).map(category => ({
  category,
  icon: EXPENSE_CATEGORY_ICONS[category],
  amount: props.ledger.totalByCategory(category),
  percentage: props.ledger.percentageByCategory(category)
})));
</script>

<template>
  <section class="summary-grid">
    <pv-card class="sa-dark-card">
      <template #content>
        <i class="pi pi-wallet text-3xl" aria-hidden="true"/>
        <p class="label">{{ t('field-management.finances.total-invested') }}</p>
        <p class="amount total">{{ ledger.totalInvestment().format() }}</p>
      </template>
    </pv-card>
    <pv-card v-for="item in categories" :key="item.category" class="sa-card">
      <template #content>
        <i :class="item.icon" class="text-3xl category-icon" aria-hidden="true"/>
        <p class="label">{{ t(`field-management.expense-category.${item.category}`) }}</p>
        <p class="amount">{{ item.amount.format() }}</p>
        <p class="sa-muted text-sm mt-1 mb-0">
          {{ t('field-management.finances.of-total', { percentage: formatNumber(item.percentage, locale, 0) }) }}
        </p>
      </template>
    </pv-card>
  </section>
</template>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.summary-grid > * {
  min-width: 0;
}

.category-icon {
  color: var(--sa-primary);
}

.label {
  margin: 8px 0 0;
  font-weight: 500;
}

.amount {
  margin: 4px 0 0;
  font-size: 24px;
  font-weight: 700;
}

.amount.total {
  color: var(--sa-tertiary-fixed-dim);
}
</style>
