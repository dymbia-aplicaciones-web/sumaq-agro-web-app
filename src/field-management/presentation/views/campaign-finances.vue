<script setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useFieldManagementStore from "../../application/field-management.store.js";
import {SetExpectedYieldCommand} from "../../domain/model/commands/set-expected-yield.command.js";
import {ExpenseCategory} from "../../domain/model/entities/expense-entry.entity.js";
import PageHeader from "../../../shared/presentation/components/page-header.vue";
import MessageCard from "../../../shared/presentation/components/message-card.vue";
import LedgerSummaryCards, {EXPENSE_CATEGORY_ICONS} from "../components/ledger-summary-cards.vue";
import ExpenseCategoryFilter from "../components/expense-category-filter.vue";
import ExpenseList from "../components/expense-list.vue";
import BreakevenPanel from "../components/breakeven-panel.vue";
import OfflineSyncBanner from "../components/offline-sync-banner.vue";

/**
 * "My expenses and earnings": cost ledger and breakeven price of the active campaign
 * (Angular `CampaignFinancesView`, US-36, US-40), with the expense history filtered by category (`ExpenseHistory`).
 */
const { t } = useI18n();
const router = useRouter();
const store = useFieldManagementStore();
const expenseMenu = ref();

const breadcrumbs = [
  { label: 'option.my-plot', link: '/field-management/dashboard' },
  { label: 'option.expenses' }
];

/** One link per expense type; each one opens its own route. */
const expenseLinks = [
  { label: `field-management.expense-category.${ExpenseCategory.INPUTS}`, link: '/field-management/finances/expenses/new/inputs', icon: EXPENSE_CATEGORY_ICONS.INPUTS },
  { label: `field-management.expense-category.${ExpenseCategory.LABOR}`, link: '/field-management/finances/expenses/new/labor', icon: EXPENSE_CATEGORY_ICONS.LABOR },
  { label: `field-management.expense-category.${ExpenseCategory.FREIGHT}`, link: '/field-management/finances/expenses/new/freight', icon: EXPENSE_CATEGORY_ICONS.FREIGHT }
].map(item => ({ ...item, command: () => router.push(item.link) }));

/** Category of the expense history, or `null` for all of them. */
const categoryFilter = ref(null);

/** `ExpenseHistory` read model: expenses of the chosen category, the most recent first. */
const expenseHistory = computed(() => store.ledger ? store.ledger.expenseHistory(categoryFilter.value) : []);

/** Subtitle, e.g. "Pampa Alta | Season 2026-I". */
const subtitle = computed(() => store.selectedPlot
    ? t('field-management.finances.subtitle', { plot: store.selectedPlot.name, season: store.activeCampaign?.season ?? '' })
    : '');

/** @param {number} expectedYield - New expected yield. */
const onExpectedYieldChange = (expectedYield) => {
  const ledger = store.ledger;
  if (!ledger) return;
  store.setExpectedYield(new SetExpectedYieldCommand({ ledgerId: ledger.id, expectedYield, unit: ledger.yieldUnit }));
};
</script>

<template>
  <div class="page">
    <pv-progress-bar v-if="store.loading" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>

    <page-header :breadcrumbs="breadcrumbs" :title="t('option.expenses')" :subtitle="subtitle">
      <div class="header-actions">
        <pv-button outlined class="sa-pill register" icon="pi pi-calendar" :label="t('field-management.campaigns.title')"
                   @click="router.push('/field-management/campaigns')"/>
        <pv-button v-if="store.ledger" outlined class="sa-pill register" icon="pi pi-chart-bar" :label="t('field-management.reports.title')"
                   @click="router.push('/field-management/finances/reports')"/>
        <template v-if="store.ledger && !store.ledger.frozen">
          <pv-button class="sa-pill register" icon="pi pi-plus" :label="t('field-management.finances.register-expense')"
                     aria-haspopup="true" @click="expenseMenu.toggle($event)"/>
          <pv-menu ref="expenseMenu" :model="expenseLinks" popup>
            <template #item="{ item, props }">
              <a v-bind="props.action"><i :class="item.icon"/><span>{{ t(item.label) }}</span></a>
            </template>
          </pv-menu>
        </template>
      </div>
    </page-header>

    <offline-sync-banner :online="store.online" :pending="store.pendingExpenseCount" :syncing="store.syncing" @sync="store.syncPendingExpenses()"/>

    <message-card v-if="store.error" icon="pi pi-times-circle" :message="t(store.error)" alert/>

    <template v-if="store.ledger">
      <message-card v-if="store.ledger.frozen" icon="pi pi-lock" :message="t('field-management.finances.ledger-closed')"/>

      <ledger-summary-cards :ledger="store.ledger" role="region" :aria-label="t('field-management.finances.summary')"/>

      <expense-category-filter :selected="categoryFilter" @selected-change="categoryFilter = $event"/>
      <div class="finances-grid">
        <expense-list :entries="expenseHistory"/>
        <breakeven-panel :ledger="store.ledger" :saving="store.loading" @expected-yield-change="onExpectedYieldChange"/>
      </div>
    </template>
    <message-card v-else-if="!store.loading" icon="pi pi-receipt" :message="t('field-management.finances.no-ledger')">
      <template #actions>
        <pv-button :label="t('field-management.finances.select-plot')" @click="router.push('/field-management/plots')"/>
      </template>
    </message-card>
  </div>
</template>

<style scoped>
.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.register.p-button {
  height: 48px;
}

.finances-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
  align-items: stretch;
  gap: 24px;
}

@media (max-width: 1024px) {
  .finances-grid {
    grid-template-columns: 1fr;
  }
}
</style>
