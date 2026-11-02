<script setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useFieldManagementStore from "../../application/field-management.store.js";
import {CloseCropCampaignCommand} from "../../domain/model/commands/close-crop-campaign.command.js";
import {ExportCampaignCostReportCommand} from "../../domain/model/commands/export-campaign-cost-report.command.js";
import {RecordActualYieldCommand} from "../../domain/model/commands/record-actual-yield.command.js";
import PageHeader from "../../../shared/presentation/components/page-header.vue";
import MessageCard from "../../../shared/presentation/components/message-card.vue";
import CampaignSummaryCard, {campaignSummaryOf} from "../components/campaign-summary-card.vue";
import CloseCampaignDialog from "../components/close-campaign-dialog.vue";

/**
 * "My campaigns": every campaign of the selected plot (Angular `CampaignHistoryView`,
 * `CampaignSummary` read model). The producer closes the campaign in progress and starts a new one.
 */
const { t } = useI18n();
const router = useRouter();
const store = useFieldManagementStore();

/** `CampaignSummary` of every campaign of the selected plot, the most recent first. */
const summaries = computed(() => {
  const plot = store.selectedPlot;
  if (!plot) return [];
  return [...store.campaigns]
      .sort((a, b) => b.id - a.id)
      .map(campaign => campaignSummaryOf(store, campaign, store.ledgersByCampaign.get(campaign.id) ?? null, plot.areaHectares));
});

const breadcrumbs = [
  { label: 'option.my-plot', link: '/field-management/dashboard' },
  { label: 'field-management.campaigns.title' }
];

/** Subtitle, e.g. "Pampa Alta · 3 campaigns". */
const subtitle = computed(() => store.selectedPlot
    ? t('field-management.campaigns.subtitle', { plot: store.selectedPlot.name, count: summaries.value.length })
    : '');

/** Campaign the producer is closing. */
const closing = ref(null);
const dialogVisible = ref(false);

/**
 * Asks for confirmation (and the harvested yield) before closing the campaign.
 * @param {import('../components/campaign-summary-card.vue').CampaignSummary} summary - Campaign to close.
 */
const onClose = (summary) => {
  closing.value = summary;
  dialogVisible.value = true;
};

/** @param {{actualYield: number|null}} result - Answer of the producer. */
const onConfirmClose = (result) => {
  const summary = closing.value;
  if (!summary) return;
  const actualYield = result.actualYield && summary.ledgerId !== null
      ? new RecordActualYieldCommand({ ledgerId: summary.ledgerId, actualYield: result.actualYield, unit: summary.yieldUnit })
      : undefined;
  store.closeCampaign(new CloseCropCampaignCommand({ campaignId: summary.campaignId }), actualYield);
};

/** @param {import('../components/campaign-summary-card.vue').CampaignSummary} summary - Campaign of the report. */
const onExport = (summary) => store.exportCostReport(new ExportCampaignCostReportCommand({ campaignId: summary.campaignId }));
</script>

<template>
  <div class="page">
    <pv-progress-bar v-if="store.loading" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>

    <page-header :breadcrumbs="breadcrumbs" :title="t('field-management.campaigns.title')" :subtitle="subtitle">
      <pv-button v-if="store.selectedPlot && !store.hasCampaignInProgress" class="sa-pill start" icon="pi pi-plus"
                 :label="t('field-management.campaigns.new')" @click="router.push('/field-management/campaigns/new')"/>
    </page-header>

    <message-card v-if="store.error" icon="pi pi-times-circle" :message="t(store.error)" alert/>

    <template v-if="store.selectedPlot">
      <message-card v-if="store.hasCampaignInProgress" icon="pi pi-info-circle" :message="t('field-management.campaigns.one-in-progress')"/>

      <section class="campaign-list" :aria-label="t('field-management.campaigns.title')">
        <campaign-summary-card v-for="summary in summaries" :key="summary.campaignId" :summary="summary" :saving="store.loading"
                               @close-campaign="onClose" @export-report="onExport"/>
        <message-card v-if="summaries.length === 0" icon="pi pi-sun" :message="t('field-management.campaigns.empty')">
          <template #actions>
            <pv-button :label="t('field-management.campaigns.new')" @click="router.push('/field-management/campaigns/new')"/>
          </template>
        </message-card>
      </section>
    </template>
    <message-card v-else-if="!store.loading" icon="pi pi-th-large" :message="t('field-management.finances.no-ledger')">
      <template #actions>
        <pv-button :label="t('field-management.finances.select-plot')" @click="router.push('/field-management/plots')"/>
      </template>
    </message-card>

    <close-campaign-dialog v-if="closing" v-model:visible="dialogVisible" :season="closing.season" :yield-unit="closing.yieldUnit"
                           :actual-yield="closing.actualYield" @confirm="onConfirmClose"/>
  </div>
</template>

<style scoped>
.start.p-button {
  height: 48px;
}

.campaign-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
