<script setup>
import {useI18n} from "vue-i18n";
import {formatDate} from "../../../shared/presentation/format.js";
import {EXPENSE_CATEGORY_ICONS} from "./ledger-summary-cards.vue";

/** Table with the expenses of the campaign, the most recent first (Angular `ExpenseList`, US-36). */
defineProps({
  /** @type {import('../../domain/model/entities/expense-entry.entity.js').ExpenseEntry[]} */
  entries: { type: Array, required: true }
});
const { t, locale } = useI18n();
</script>

<template>
  <pv-card class="list-card sa-card">
    <template #title>{{ t('field-management.finances.expenses') }}</template>
    <template #content>
      <p v-if="entries.length === 0" class="sa-muted m-0 pt-2">{{ t('field-management.finances.no-expenses') }}</p>
      <!-- On phones the table scrolls sideways instead of the page. -->
      <pv-data-table v-else :value="entries" data-key="id" scrollable table-style="min-width: 560px" row-hover>
        <pv-column :header="t('field-management.finances.col-date')" body-class="white-space-nowrap">
          <template #body="slotProps">{{ formatDate(slotProps.data.expenseDate, locale) }}</template>
        </pv-column>
        <pv-column :header="t('field-management.finances.col-category')">
          <template #body="slotProps">
            <span class="inline-flex align-items-center gap-2">
              <i :class="EXPENSE_CATEGORY_ICONS[slotProps.data.category]" class="category-icon" aria-hidden="true"/>
              {{ t(`field-management.expense-category.${slotProps.data.category}`) }}
            </span>
          </template>
        </pv-column>
        <pv-column field="description" :header="t('field-management.finances.col-description')" body-class="description"/>
        <pv-column field="quantity" :header="t('field-management.finances.col-quantity')" header-class="number" body-class="number"/>
        <pv-column :header="t('field-management.finances.col-unit-price')" header-class="number" body-class="number">
          <template #body="slotProps">{{ slotProps.data.unitPrice.format() }}</template>
        </pv-column>
        <pv-column :header="t('field-management.finances.col-total')" header-class="number" body-class="number font-semibold">
          <template #body="slotProps">{{ slotProps.data.total().format() }}</template>
        </pv-column>
      </pv-data-table>
    </template>
  </pv-card>
</template>

<style scoped>
.list-card {
  min-width: 0;
  overflow: hidden;
}

.category-icon {
  color: var(--sa-primary);
}

.list-card :deep(.number) {
  white-space: nowrap;
  text-align: right;
}

.list-card :deep(.description) {
  min-width: 140px;
  overflow-wrap: anywhere;
}

.list-card :deep(.p-datatable-thead > tr > th) {
  background: var(--sa-surface-container-low);
}
</style>
