<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {ExpenseCategory} from "../../domain/model/entities/expense-entry.entity.js";
import {EXPENSE_CATEGORY_ICONS} from "./ledger-summary-cards.vue";

/** Chips to filter the expense history by category (Angular `ExpenseCategoryFilter`, `ExpenseHistory` read model). */
const props = defineProps({
  /** Category shown, or `null` for all of them. */
  selected: { type: String, default: null }
});
const emit = defineEmits(['selected-change']);
const { t } = useI18n();

const options = ['ALL', ...Object.values(ExpenseCategory)];

/** `ALL` stands for `null` (every category). */
const value = computed({
  get: () => props.selected ?? 'ALL',
  set: option => emit('selected-change', !option || option === 'ALL' ? null : option)
});
</script>

<template>
  <pv-select-button v-model="value" :options="options" :allow-empty="false" class="category-filter"
                    :aria-label="t('field-management.finances.filter')">
    <template #option="{ option }">
      <i v-if="option !== 'ALL'" :class="EXPENSE_CATEGORY_ICONS[option]" aria-hidden="true"/>
      {{ option === 'ALL' ? t('field-management.finances.all-categories') : t(`field-management.expense-category.${option}`) }}
    </template>
  </pv-select-button>
</template>

<style scoped>
.category-filter {
  flex-wrap: wrap;
}
</style>
