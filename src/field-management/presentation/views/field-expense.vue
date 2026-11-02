<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import useFieldManagementStore from "../../application/field-management.store.js";
import {RecordDailyLaborExpenseCommand} from "../../domain/model/commands/record-daily-labor-expense.command.js";
import {RecordFieldFreightExpenseCommand} from "../../domain/model/commands/record-field-freight-expense.command.js";
import {RecordInputExpenseCommand} from "../../domain/model/commands/record-input-expense.command.js";
import {ExpenseCategory} from "../../domain/model/entities/expense-entry.entity.js";
import PageHeader from "../../../shared/presentation/components/page-header.vue";
import MessageCard from "../../../shared/presentation/components/message-card.vue";
import FieldExpenseForm from "../components/field-expense-form.vue";
import OfflineSyncBanner from "../components/offline-sync-banner.vue";
import {EXPENSE_CATEGORY_ICONS} from "../components/ledger-summary-cards.vue";

const FINANCES_ROUTE = '/field-management/finances';

/** Registers an expense of the active campaign; each expense type has its own route (Angular `FieldExpenseView`, US-37 to US-39). */
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useFieldManagementStore();

/** Comes from `meta.category` of the route. */
const category = computed(() => route.meta['category'] ?? ExpenseCategory.INPUTS);

const breadcrumbs = [
  { label: 'option.my-plot', link: '/field-management/dashboard' },
  { label: 'option.expenses', link: FINANCES_ROUTE },
  { label: 'field-management.finances.register-expense' }
];

const tabs = [
  { category: ExpenseCategory.INPUTS, link: `${FINANCES_ROUTE}/expenses/new/inputs` },
  { category: ExpenseCategory.LABOR, link: `${FINANCES_ROUTE}/expenses/new/labor` },
  { category: ExpenseCategory.FREIGHT, link: `${FINANCES_ROUTE}/expenses/new/freight` }
];

/** Expenses can only be added to an open ledger. */
const canRecord = computed(() => !!store.ledger && !store.ledger.frozen);

const onCancel = () => router.push(FINANCES_ROUTE);

/**
 * @param {Object} data - Data of the expense form.
 * @param {number} ledgerId - Ledger of the active campaign.
 * @returns {RecordInputExpenseCommand|RecordDailyLaborExpenseCommand|RecordFieldFreightExpenseCommand} Domain command.
 */
const toCommand = (data, ledgerId) => {
  switch (data.category) {
    case ExpenseCategory.INPUTS:
      return new RecordInputExpenseCommand({ ledgerId, ...data });
    case ExpenseCategory.LABOR:
      return new RecordDailyLaborExpenseCommand({ ledgerId, ...data });
    default:
      return new RecordFieldFreightExpenseCommand({ ledgerId, ...data });
  }
};

/**
 * Turns the form data into a domain command and sends it to the store.
 * @param {Object} data - Data of the expense form.
 */
const onRecord = (data) => store.recordExpense(toCommand(data, store.ledger?.id), onCancel);
</script>

<template>
  <div class="page expense-view">
    <pv-progress-bar v-if="store.loading" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>
    <page-header :breadcrumbs="breadcrumbs" :title="t('field-management.expense-form.title')"
                 :subtitle="store.selectedPlot ? t('field-management.expense-form.subtitle', { plot: store.selectedPlot.name }) : ''"/>

    <!-- Without connection the expense is kept on the device and synchronized later -->
    <offline-sync-banner :online="store.online" :pending="store.pendingExpenseCount" :syncing="store.syncing" @sync="store.syncPendingExpenses()"/>

    <message-card v-if="store.error" icon="pi pi-times-circle" :message="t(store.error)" alert/>

    <pv-card v-if="canRecord" class="sa-card overflow-hidden">
      <template #header>
        <!-- Each tab is a route: /finances/expenses/new/inputs | labor | freight -->
        <nav class="tabs" :aria-label="t('field-management.expense-form.types')">
          <router-link v-for="tab in tabs" :key="tab.category" :to="tab.link" class="tab" :class="{ 'tab--active': tab.category === category }">
            <i :class="EXPENSE_CATEGORY_ICONS[tab.category]" aria-hidden="true"/>
            {{ t(`field-management.expense-category.${tab.category}`) }}
          </router-link>
        </nav>
      </template>
      <template #content>
        <field-expense-form :key="category" :category="category" :saving="store.loading" @submitted="onRecord" @cancel="onCancel"/>
      </template>
    </pv-card>
    <message-card v-else-if="!store.loading" icon="pi pi-lock"
                  :message="t(store.ledger ? 'field-management.finances.ledger-closed' : 'field-management.finances.no-ledger')"/>
  </div>
</template>

<style scoped>
.expense-view {
  max-width: 880px;
}

.tabs {
  display: flex;
  overflow-x: auto;
  border-bottom: 1px solid var(--sa-outline-variant);
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  border-bottom: 2px solid transparent;
  color: var(--sa-on-surface-variant);
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
}

.tab--active {
  border-bottom-color: var(--sa-primary);
  color: var(--sa-primary);
}
</style>
