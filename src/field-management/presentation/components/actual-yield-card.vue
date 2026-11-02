<script setup>
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";

/**
 * Form of the yield actually harvested (Angular `ActualYieldCard`, `RecordActualYield`).
 * Harvest Certification records it when the batch is weighed (policy P10);
 * the producer can also type it after the harvest.
 */
const props = defineProps({
  /** @type {import('../../domain/model/entities/campaign-ledger.entity.js').CampaignLedger} */
  ledger: { type: Object, required: true },
  saving: { type: Boolean, default: false }
});
const emit = defineEmits(['actual-yield-change']);
const { t } = useI18n();

const actualYield = ref(null);
const touched = ref(false);
const pristine = ref(true);

// Show the saved value every time the ledger changes.
watch(() => props.ledger, ledger => {
  actualYield.value = ledger.actualYield;
  pristine.value = true;
  touched.value = false;
}, { immediate: true });

const invalid = computed(() => actualYield.value === null || actualYield.value < 0.01);

/** Emits the harvested yield when it is valid. */
const onSave = () => {
  touched.value = true;
  if (!invalid.value) emit('actual-yield-change', actualYield.value);
};
</script>

<template>
  <pv-card class="yield-card sa-card">
    <template #title>
      <span class="flex align-items-center gap-3 text-lg">
        <i class="pi pi-gauge text-3xl title-icon" aria-hidden="true"/>{{ t('field-management.reports.actual-yield') }}
      </span>
    </template>
    <template #subtitle>{{ t('field-management.reports.actual-yield-subtitle') }}</template>
    <template #content>
      <form class="yield-form" novalidate @submit.prevent="onSave">
        <div class="sa-field flex-1">
          <label for="actual-yield-input">{{ t('field-management.reports.harvested') }}</label>
          <pv-input-group>
            <pv-input-number v-model="actualYield" input-id="actual-yield-input" :min="0" :max-fraction-digits="2"
                             :invalid="touched && invalid" @input="pristine = false"/>
            <pv-input-group-addon>{{ t(`field-management.yield-unit.${ledger.yieldUnit}`) }}</pv-input-group-addon>
          </pv-input-group>
          <small v-if="touched && invalid" class="sa-error">{{ t('field-management.expense-form.positive') }}</small>
        </div>
        <pv-button type="submit" outlined :label="t('common.save')" :disabled="saving || pristine"/>
      </form>
    </template>
  </pv-card>
</template>

<style scoped>
.yield-card {
  max-width: 560px;
  min-width: 0;
}

.title-icon {
  color: var(--sa-primary);
}

.yield-form {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-top: 16px;
}
</style>
