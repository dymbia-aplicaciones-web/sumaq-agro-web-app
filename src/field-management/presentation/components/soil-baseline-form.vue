<script setup>
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {SoilTexture} from "../../domain/model/entities/field-plot.entity.js";

/** Form of the initial soil analysis (Angular `SoilBaselineForm`, `RecordSoilBaseline`). It validates and emits; the view saves. */
const props = defineProps({
  /** @type {import('../../domain/model/entities/field-plot.entity.js').SoilBaseline|null} Analysis already recorded, shown to be updated. */
  current: { type: Object, default: null },
  saving: { type: Boolean, default: false }
});
const emit = defineEmits(['submitted', 'cancel']);
const { t } = useI18n();

const textures = computed(() => Object.values(SoilTexture).map(texture => ({ value: texture, label: t(`field-management.soil-texture.${texture}`) })));
const today = new Date();
const form = ref({ ph: null, texture: SoilTexture.LOAMY, organicMatterPercentage: null, recordedAt: today });
const submitted = ref(false);

// Show the analysis already recorded.
watch(() => props.current, soil => {
  if (!soil) return;
  form.value = { ph: soil.ph, texture: soil.texture, organicMatterPercentage: soil.organicMatterPercentage, recordedAt: soil.recordedAt };
}, { immediate: true });

/** Validation errors (i18n keys), like the Angular validators. */
const errors = computed(() => {
  const value = form.value;
  const result = {};
  if (value.ph === null || value.ph < 0 || value.ph > 14) result.ph = 'field-management.soil.ph-range';
  if (!value.texture) result.texture = 'common.required';
  if (value.organicMatterPercentage === null || value.organicMatterPercentage < 0 || value.organicMatterPercentage > 100)
    result.organicMatterPercentage = 'field-management.soil.percentage-range';
  if (!value.recordedAt) result.recordedAt = 'common.required';
  return result;
});

/**
 * @param {string} field - Field name.
 * @returns {string|undefined} Translated error after the first submit.
 */
const errorOf = (field) => submitted.value && errors.value[field] ? t(errors.value[field]) : undefined;

/** Emits the analysis when the form is valid. */
const onSubmit = () => {
  submitted.value = true;
  if (Object.keys(errors.value).length) return;
  const value = form.value;
  emit('submitted', {
    ph: value.ph,
    texture: value.texture,
    organicMatterPercentage: value.organicMatterPercentage,
    recordedAt: value.recordedAt
  });
};
</script>

<template>
  <form class="form-grid" novalidate @submit.prevent="onSubmit">
    <div class="sa-field">
      <label for="soil-ph">{{ t('field-management.soil.ph') }} *</label>
      <pv-input-number v-model="form.ph" input-id="soil-ph" :min="0" :max="14" :step="0.1" :min-fraction-digits="0"
                       :max-fraction-digits="2" placeholder="6.2" :invalid="!!errorOf('ph')" fluid/>
      <small class="sa-muted">{{ t('field-management.soil.ph-hint') }}</small>
      <small v-if="errorOf('ph')" class="sa-error">{{ errorOf('ph') }}</small>
    </div>

    <div class="sa-field">
      <label for="soil-texture">{{ t('field-management.soil.texture') }} *</label>
      <pv-select v-model="form.texture" input-id="soil-texture" :options="textures" option-label="label" option-value="value"
                 :invalid="!!errorOf('texture')" fluid/>
    </div>

    <div class="sa-field">
      <label for="soil-organic-matter">{{ t('field-management.soil.organic-matter') }} *</label>
      <pv-input-group>
        <pv-input-number v-model="form.organicMatterPercentage" input-id="soil-organic-matter" :min="0" :max="100" :step="0.1"
                         :max-fraction-digits="2" placeholder="3.5" :invalid="!!errorOf('organicMatterPercentage')"/>
        <pv-input-group-addon>%</pv-input-group-addon>
      </pv-input-group>
      <small v-if="errorOf('organicMatterPercentage')" class="sa-error">{{ errorOf('organicMatterPercentage') }}</small>
    </div>

    <div class="sa-field">
      <label for="soil-date">{{ t('field-management.soil.date') }} *</label>
      <pv-date-picker v-model="form.recordedAt" input-id="soil-date" date-format="dd/mm/yy" :max-date="today" show-icon
                      :invalid="!!errorOf('recordedAt')" fluid/>
      <small v-if="errorOf('recordedAt')" class="sa-error">{{ errorOf('recordedAt') }}</small>
    </div>

    <div class="full flex justify-content-between mt-2">
      <pv-button type="button" outlined class="sa-pill" :label="t('common.cancel')" @click="emit('cancel')"/>
      <pv-button type="submit" class="sa-pill" icon="pi pi-save" :label="t('common.save')" :disabled="saving"/>
    </div>
  </form>
</template>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 48px;
}

.full {
  grid-column: 1 / -1;
}

@media (max-width: 719.98px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
