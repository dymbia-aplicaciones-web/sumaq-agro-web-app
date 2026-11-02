<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useFieldManagementStore from "../../application/field-management.store.js";
import {RecordSowingDateCommand} from "../../domain/model/commands/record-sowing-date.command.js";
import {RegisterFieldPlotCommand} from "../../domain/model/commands/register-field-plot.command.js";
import {SelectCropTypeCommand} from "../../domain/model/commands/select-crop-type.command.js";
import {SetExpectedYieldCommand} from "../../domain/model/commands/set-expected-yield.command.js";
import {SpecifySeedVarietyCommand} from "../../domain/model/commands/specify-seed-variety.command.js";
import {StartCropCampaignCommand} from "../../domain/model/commands/start-crop-campaign.command.js";
import PageHeader from "../../../shared/presentation/components/page-header.vue";
import MessageCard from "../../../shared/presentation/components/message-card.vue";
import PlotQuotaSummary from "../components/plot-quota-summary.vue";
import RegistrationSteps from "../components/registration-steps.vue";
import PlotRegistrationForm from "../components/plot-registration-form.vue";

/** Step 1 of 2: registers the plot and its first campaign, then opens the map (Angular `PlotRegistrationView`, US-28, US-32 to US-34, US-40). */
const { t } = useI18n();
const router = useRouter();
const store = useFieldManagementStore();

/** Slot the new plot will use, e.g. 3 when 2 plots exist. */
const slotNumber = computed(() => store.plotCount + 1);

const breadcrumbs = [
  { label: 'option.my-plot', link: '/field-management/dashboard' },
  { label: 'field-management.plots.manage', link: '/field-management/plots' },
  { label: 'field-management.steps.crop-data' }
];

/**
 * Turns the form data into domain commands and sends them to the store.
 * @param {Object} data - Data of the registration form.
 */
const onRegister = (data) => {
  const ownerUserId = store.currentUserId;
  if (ownerUserId === null) return;
  const command = new RegisterFieldPlotCommand({
    ownerUserId,
    name: data.name,
    region: data.region,
    declaredAreaHectares: data.declaredAreaHectares
  });
  store.registerPlot(command, {
    start: new StartCropCampaignCommand({ plotId: 0, season: store.seasonOf(data.sowingDate) }),
    cropType: new SelectCropTypeCommand({ campaignId: 0, cropType: data.cropType }),
    seedVariety: new SpecifySeedVarietyCommand({ campaignId: 0, varietyName: data.seedVariety, custom: data.customVariety }),
    sowingDate: new RecordSowingDateCommand({ campaignId: 0, sowingDate: data.sowingDate }),
    expectedYield: data.expectedYield
        ? new SetExpectedYieldCommand({ ledgerId: 0, expectedYield: data.expectedYield, unit: data.yieldUnit })
        : undefined
  }, plot => router.push(`/field-management/plots/${plot.id}/boundary`));
};

const onCancel = () => router.push('/field-management/plots');
</script>

<template>
  <div class="page registration">
    <pv-progress-bar v-if="store.loading" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>
    <page-header
        :breadcrumbs="breadcrumbs"
        :title="t(store.plotQuotaReady && !store.plotQuotaReached ? 'field-management.plot-form.title' : 'field-management.plots.register',
                  { slot: slotNumber, quota: store.plotQuota })"
        :subtitle="t('field-management.plot-form.subtitle')"/>
    <plot-quota-summary/>

    <message-card v-if="store.error" icon="pi pi-times-circle" :message="t(store.error)" alert/>

    <div v-if="store.plotQuotaReached || store.registrationIncomplete">
      <pv-button outlined :label="t('field-management.plots.manage')" @click="onCancel"/>
    </div>
    <template v-else-if="store.plotQuotaReady">
      <registration-steps :current="1"/>
      <pv-card class="sa-card">
        <template #content>
          <plot-registration-form :saving="store.loading || !store.canRegisterPlot" @submitted="onRegister" @cancel="onCancel"/>
        </template>
      </pv-card>
    </template>
    <div v-else>
      <pv-button outlined :label="t('common.back')" @click="onCancel"/>
    </div>
  </div>
</template>

<style scoped>
.registration {
  max-width: 1040px;
}
</style>
