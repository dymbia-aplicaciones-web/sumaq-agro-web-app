<script setup>
import {useI18n} from "vue-i18n";

/** Card of a free slot of the plan to register a new plot (Angular `PlotSlotCard`, US-22). */
defineProps({
  /** Position of the free slot in the plan. */
  position: { type: Number, required: true }
});
/** `register`: the producer wants to register a plot in this slot. */
const emit = defineEmits(['register']);
const { t } = useI18n();
</script>

<template>
  <pv-card class="slot-card sa-card">
    <template #title>
      <span class="plot-number">{{ t('field-management.plots.plot-number', { number: position }) }}</span>
    </template>
    <template #content>
      <span class="sa-chip">
        <i class="pi pi-plus-circle" aria-hidden="true"/>{{ t('field-management.plots.slot-available') }}
      </span>
      <p class="sa-muted mt-3 mb-0">{{ t('field-management.plots.slot-text', { number: position }) }}</p>
    </template>
    <template #footer>
      <div class="flex justify-content-center">
        <pv-button class="sa-pill" icon="pi pi-plus-circle" :label="t('field-management.plots.register')" @click="emit('register')"/>
      </div>
    </template>
  </pv-card>
</template>

<style scoped>
.slot-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 300px;
  min-width: 0;
}

.slot-card :deep(.p-card-body),
.slot-card :deep(.p-card-content) {
  flex: 1;
}

.plot-number {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
}
</style>
