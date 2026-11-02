<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useFieldManagementStore from "../../application/field-management.store.js";
import {ExportCampaignCostReportCommand} from "../../domain/model/commands/export-campaign-cost-report.command.js";
import {RecordActualYieldCommand} from "../../domain/model/commands/record-actual-yield.command.js";
import PageHeader from "../../../shared/presentation/components/page-header.vue";
import MessageCard from "../../../shared/presentation/components/message-card.vue";
import BreakevenReportCard from "../components/breakeven-report-card.vue";
import CostPerHectareCard from "../components/cost-per-hectare-card.vue";
import ActualYieldCard from "../components/actual-yield-card.vue";

/**
 * "Cost reports" of the active campaign (Angular `CostReportsView`): `BreakevenReport` and
 * `CostPerHectareReport`, the harvested yield and the export of the report.
 */
const { t } = useI18n();
const router = useRouter();
const store = useFieldManagementStore();

const breadcrumbs = [
  { label: 'option.my-plot', link: '/field-management/dashboard' },
  { label: 'option.expenses', link: '/field-management/finances' },
  { label: 'field-management.reports.title' }
];

const subtitle = computed(() => store.selectedPlot
    ? t('field-management.finances.subtitle', { plot: store.selectedPlot.name, season: store.activeCampaign?.season ?? '' })
    : '');

/** @param {number} actualYield - Harvested yield. */
const onActualYieldChange = (actualYield) => {
  const ledger = store.ledger;
  if (!ledger) return;
  store.recordActualYield(new RecordActualYieldCommand({ ledgerId: ledger.id, actualYield, unit: ledger.yieldUnit }));
};

const onExport = () => {
  const campaign = store.activeCampaign;
  if (!campaign) return;
  store.exportCostReport(new ExportCampaignCostReportCommand({ campaignId: campaign.id }));
};
</script>

<template>
  <div class="page">
    <pv-progress-bar v-if="store.loading" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>

    <page-header :breadcrumbs="breadcrumbs" :title="t('field-management.reports.title')" :subtitle="subtitle">
      <pv-button v-if="store.ledger" class="sa-pill export" icon="pi pi-download" :label="t('field-management.reports.export')" @click="onExport"/>
    </page-header>

    <message-card v-if="store.error" icon="pi pi-times-circle" :message="t(store.error)" alert/>

    <template v-if="store.ledger">
      <div class="reports-grid">
        <breakeven-report-card :ledger="store.ledger"/>
        <cost-per-hectare-card :ledger="store.ledger" :area-hectares="store.selectedPlot?.areaHectares ?? 0"/>
      </div>
      <actual-yield-card :ledger="store.ledger" :saving="store.loading" @actual-yield-change="onActualYieldChange"/>
    </template>
    <message-card v-else-if="!store.loading" icon="pi pi-receipt" :message="t('field-management.finances.no-ledger')">
      <template #actions>
        <pv-button :label="t('field-management.finances.select-plot')" @click="router.push('/field-management/plots')"/>
      </template>
    </message-card>
  </div>
</template>

<style scoped>
.export.p-button {
  height: 48px;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
  gap: 24px;
}

@media (max-width: 1024px) {
  .reports-grid {
    grid-template-columns: 1fr;
  }
}
</style>
