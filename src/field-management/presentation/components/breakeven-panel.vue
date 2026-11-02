<script setup>
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";

/** Breakeven price of the campaign and the expected yield it depends on (Angular `BreakevenPanel`, US-40). */
const props = defineProps({
  /** @type {import('../../domain/model/entities/campaign-ledger.entity.js').CampaignLedger} */
  ledger: { type: Object, required: true },
  saving: { type: Boolean, default: false }
});
const emit = defineEmits(['expected-yield-change']);
const { t } = useI18n();

const expectedYield = ref(null);
const touched = ref(false);
const pristine = ref(true);

// Show the saved value every time the ledger changes.
watch(() => props.ledger, ledger => {
  expectedYield.value = ledger.expectedYield > 0 ? ledger.expectedYield : null;
  pristine.value = true;
  touched.value = false;
}, { immediate: true });

const invalid = computed(() => expectedYield.value === null || expectedYield.value < 1);
const unit = computed(() => t(`field-management.yield-unit.${props.ledger.yieldUnit}`));

/** Emits the new expected yield when it is valid. */
const onSave = () => {
  touched.value = true;
  if (!invalid.value) emit('expected-yield-change', expectedYield.value);
};
</script>

<template>
  <pv-card class="breakeven-card sa-card">
    <template #title>
      <span class="flex align-items-center gap-3 text-lg">
        <i class="pi pi-chart-line text-3xl title-icon" aria-hidden="true"/>{{ t('field-management.finances.breakeven-title') }}
      </span>
    </template>
    <template #content>
      <form class="yield-form" novalidate @submit.prevent="onSave">
        <div class="sa-field yield-field">
          <label for="expected-yield-input">{{ t('field-management.finances.expected-yield') }}</label>
          <pv-input-group>
            <pv-input-number v-model="expectedYield" input-id="expected-yield-input" :min="0" :readonly="ledger.frozen"
                             :invalid="touched && invalid" @input="pristine = false"/>
            <pv-input-group-addon>{{ unit }}</pv-input-group-addon>
          </pv-input-group>
          <small v-if="touched && invalid" class="sa-error">{{ t('field-management.expense-form.positive') }}</small>
        </div>
        <pv-button v-if="!ledger.frozen" type="submit" outlined :label="t('field-management.finances.update-yield')" :disabled="saving || pristine"/>
      </form>

      <template v-if="ledger.expectedYield > 0 || ledger.actualYield">
        <p class="price">{{ ledger.breakevenPrice().format() }}</p>
        <p class="sa-muted mt-1 mb-3">
          {{ t('field-management.finances.breakeven-hint', { unit: t(`field-management.yield-unit.per-${ledger.yieldUnit}`) }) }}
        </p>
        <p v-if="ledger.actualYield" class="sa-muted mt-1 mb-3">
          {{ t('field-management.finances.actual-yield', { quantity: ledger.actualYield, unit }) }}
        </p>
        <span class="sa-chip">
          <i class="pi pi-tag" aria-hidden="true"/>{{ t('field-management.finances.suggested-price', { price: ledger.suggestedPrice().format() }) }}
        </span>
      </template>
      <p v-else class="sa-muted">{{ t('field-management.finances.yield-required') }}</p>
    </template>
  </pv-card>
</template>

<style scoped>
.breakeven-card {
  min-width: 0;
}

.title-icon {
  color: var(--sa-primary);
}

.yield-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
  margin: 16px 0;
}

.yield-field {
  flex: 1 1 160px;
}

.price {
  margin: 0;
  color: var(--sa-primary);
  font-size: 36px;
  font-weight: 700;
  overflow-wrap: anywhere;
}
</style>
