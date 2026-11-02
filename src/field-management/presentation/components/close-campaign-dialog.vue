<script setup>
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";

/**
 * Asks the producer to confirm the closing of a campaign and, optionally,
 * the yield harvested (Angular `CloseCampaignDialog`, `CloseCropCampaign`, `RecordActualYield`).
 */
const props = defineProps({
  season: { type: String, required: true },
  yieldUnit: { type: String, required: true },
  /** Actual yield already recorded, if any. */
  actualYield: { type: Number, default: null }
});
const visible = defineModel('visible', { type: Boolean, required: true });
/** `confirm` sends the harvested yield, or `null` when it is not known yet. */
const emit = defineEmits(['confirm']);
const { t } = useI18n();

const value = ref(props.actualYield);
watch(visible, open => { if (open) value.value = props.actualYield; });

const invalid = computed(() => value.value !== null && value.value < 0.01);

/** Closes the dialog with the answer of the producer. */
const onConfirm = () => {
  if (invalid.value) return;
  visible.value = false;
  emit('confirm', { actualYield: value.value || null });
};
</script>

<template>
  <pv-dialog v-model:visible="visible" modal :header="t('field-management.campaigns.close-title', { season })"
             :style="{ width: 'calc(100vw - 32px)', maxWidth: '480px' }">
    <p class="warning">
      <i class="pi pi-lock" aria-hidden="true"/>
      {{ t('field-management.campaigns.close-warning') }}
    </p>

    <div class="sa-field mt-2">
      <label for="close-actual-yield">{{ t('field-management.reports.actual-yield') }}</label>
      <pv-input-group>
        <pv-input-number v-model="value" input-id="close-actual-yield" :min="0" :max-fraction-digits="2" :invalid="invalid"/>
        <pv-input-group-addon>{{ t(`field-management.yield-unit.${yieldUnit}`) }}</pv-input-group-addon>
      </pv-input-group>
      <small class="sa-muted">{{ t('field-management.campaigns.actual-yield-hint') }}</small>
      <small v-if="invalid" class="sa-error">{{ t('field-management.expense-form.positive') }}</small>
    </div>

    <template #footer>
      <pv-button text :label="t('common.cancel')" @click="visible = false"/>
      <pv-button icon="pi pi-check-circle" :label="t('field-management.campaigns.close')" @click="onConfirm"/>
    </template>
  </pv-dialog>
</template>

<style scoped>
.warning {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 0;
  color: var(--sa-on-surface-variant);
}

.warning i {
  flex-shrink: 0;
  margin-top: 3px;
  color: var(--sa-primary);
}
</style>
