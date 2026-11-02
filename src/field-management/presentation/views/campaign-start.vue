<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useFieldManagementStore from "../../application/field-management.store.js";
import {RecordSowingDateCommand} from "../../domain/model/commands/record-sowing-date.command.js";
import {SelectCropTypeCommand} from "../../domain/model/commands/select-crop-type.command.js";
import {SetExpectedYieldCommand} from "../../domain/model/commands/set-expected-yield.command.js";
import {SpecifySeedVarietyCommand} from "../../domain/model/commands/specify-seed-variety.command.js";
import {StartCropCampaignCommand} from "../../domain/model/commands/start-crop-campaign.command.js";
import {CropType} from "../../domain/model/entities/crop-campaign.entity.js";
import PageHeader from "../../../shared/presentation/components/page-header.vue";
import MessageCard from "../../../shared/presentation/components/message-card.vue";
import CampaignForm from "../components/campaign-form.vue";

const CAMPAIGNS_ROUTE = '/field-management/campaigns';

/**
 * Starts a new campaign on the selected plot once the previous one is closed (Angular `CampaignStartView`,
 * `StartCropCampaign`, `SelectCropType`, `SpecifySeedVariety`, `RecordSowingDate`).
 */
const { t } = useI18n();
const router = useRouter();
const store = useFieldManagementStore();

const breadcrumbs = [
  { label: 'option.my-plot', link: '/field-management/dashboard' },
  { label: 'field-management.campaigns.title', link: CAMPAIGNS_ROUTE },
  { label: 'field-management.campaigns.new' }
];

/** The new campaign suggests the crop of the previous one. */
const previousCropType = computed(() => store.activeCampaign?.cropType ?? CropType.ANDEAN_POTATO);

const onCancel = () => router.push(CAMPAIGNS_ROUTE);

/**
 * Turns the form data into domain commands and sends them to the store.
 * @param {Object} data - Data of the campaign form.
 */
const onStart = (data) => {
  const plotId = store.selectedPlot?.id;
  store.startCampaign({
    start: new StartCropCampaignCommand({ plotId, season: data.season }),
    cropType: new SelectCropTypeCommand({ campaignId: 0, cropType: data.cropType }),
    seedVariety: new SpecifySeedVarietyCommand({ campaignId: 0, varietyName: data.seedVariety, custom: data.customVariety }),
    sowingDate: new RecordSowingDateCommand({ campaignId: 0, sowingDate: data.sowingDate }),
    expectedYield: data.expectedYield
        ? new SetExpectedYieldCommand({ ledgerId: 0, expectedYield: data.expectedYield, unit: data.yieldUnit })
        : undefined
  }, onCancel);
};
</script>

<template>
  <div class="page">
    <pv-progress-bar v-if="store.loading" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>

    <page-header :breadcrumbs="breadcrumbs" :title="t('field-management.campaigns.new')"
                 :subtitle="store.selectedPlot ? t('field-management.campaigns.new-subtitle', { plot: store.selectedPlot.name }) : ''"/>

    <message-card v-if="store.error" icon="pi pi-times-circle" :message="t(store.error)" alert/>

    <template v-if="!store.selectedPlot">
      <message-card v-if="!store.loading" icon="pi pi-th-large" :message="t('field-management.finances.no-ledger')">
        <template #actions>
          <pv-button :label="t('field-management.finances.select-plot')" @click="router.push('/field-management/plots')"/>
        </template>
      </message-card>
    </template>
    <!-- A plot cannot have two campaigns in progress -->
    <message-card v-else-if="store.hasCampaignInProgress" icon="pi pi-lock" :message="t('field-management.campaigns.one-in-progress')" alert>
      <template #actions>
        <pv-button outlined :label="t('common.back')" @click="onCancel"/>
      </template>
    </message-card>
    <pv-card v-else class="form-card sa-card">
      <template #content>
        <campaign-form :initial-crop-type="previousCropType" :saving="store.loading" @submitted="onStart" @cancel="onCancel"/>
      </template>
    </pv-card>
  </div>
</template>

<style scoped>
.form-card {
  max-width: 880px;
}
</style>
