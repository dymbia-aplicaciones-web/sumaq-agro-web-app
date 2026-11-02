<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import useFieldManagementStore from "../../application/field-management.store.js";
import {RecordSoilBaselineCommand} from "../../domain/model/commands/record-soil-baseline.command.js";
import PageHeader from "../../../shared/presentation/components/page-header.vue";
import MessageCard from "../../../shared/presentation/components/message-card.vue";
import SoilBaselineForm from "../components/soil-baseline-form.vue";

/** Records the initial soil analysis of a plot (Angular `SoilBaselineView`, `RecordSoilBaseline`). */
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useFieldManagementStore();

/** ID taken from the route `plots/:id/soil`. */
const id = computed(() => Number(route.params.id));
const plot = computed(() => store.getPlotById(id.value));

const breadcrumbs = computed(() => [
  { label: 'option.my-plot', link: '/field-management/dashboard' },
  { label: 'field-management.plots.manage', link: '/field-management/plots' },
  { label: 'field-management.plot-detail.title', link: `/field-management/plots/${id.value}` },
  { label: 'field-management.soil.title' }
]);

const onCancel = () => router.push(`/field-management/plots/${id.value}`);

/**
 * Turns the form data into a domain command and sends it to the store.
 * @param {Object} data - pH, texture, organic matter and date of the analysis.
 */
const onRecord = (data) => store.recordSoilBaseline(new RecordSoilBaselineCommand({ plotId: id.value, ...data }), onCancel);
</script>

<template>
  <div class="page">
    <pv-progress-bar v-if="store.loading" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>

    <page-header :breadcrumbs="breadcrumbs" :title="t('field-management.soil.title')"
                 :subtitle="plot ? t('field-management.soil.subtitle', { plot: plot.name }) : ''"/>

    <message-card v-if="store.error" icon="pi pi-times-circle" :message="t(store.error)" alert/>

    <pv-card v-if="plot" class="form-card sa-card">
      <template #content>
        <soil-baseline-form :current="plot.soilBaseline" :saving="store.loading" @submitted="onRecord" @cancel="onCancel"/>
      </template>
    </pv-card>
    <message-card v-else-if="!store.plotsLoading" icon="pi pi-search" :message="t('field-management.plot-detail.not-found')">
      <template #actions>
        <pv-button :label="t('field-management.finances.select-plot')" @click="router.push('/field-management/plots')"/>
      </template>
    </message-card>
  </div>
</template>

<style scoped>
.form-card {
  max-width: 880px;
}
</style>
