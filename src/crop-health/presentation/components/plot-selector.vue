<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";

/** Parcel selection control; the parent view owns data loading and selection state (Angular `CropPlotSelector`). */
const props = defineProps({
  /** @type {Array<{id: number, name: string}>} Plots to choose from. */
  plots: { type: Array, required: true },
  selectedPlotId: { type: Number, default: null },
  disabled: { type: Boolean, default: false }
});
/** `plot-selected`: the user chose another plot. */
const emit = defineEmits(['plot-selected']);
const { t } = useI18n();

const selected = computed({
  get: () => props.selectedPlotId,
  set: plotId => { if (plotId !== null) emit('plot-selected', plotId); }
});
</script>

<template>
  <div class="flex flex-column gap-1 plot-selector">
    <label for="crop-plot-selector" class="text-sm sa-muted">{{ t('crop-health.change-plot') }}</label>
    <pv-select v-model="selected" input-id="crop-plot-selector" :options="plots" option-label="name" option-value="id"
               :disabled="disabled" fluid/>
  </div>
</template>

<style scoped>
.plot-selector {
  min-width: 240px;
  max-width: 100%;
}
</style>
