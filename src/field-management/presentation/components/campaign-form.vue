<script>
import {CropType} from "../../domain/model/entities/crop-campaign.entity.js";

/** Seed varieties suggested for each crop (US-34). */
export const SEED_VARIETIES = Object.freeze({
  [CropType.ANDEAN_POTATO]: ['Papa Canchán', 'Papa Yungay', 'Papa Perricholi', 'Papa Única'],
  [CropType.SPECIALTY_COFFEE]: ['Typica', 'Caturra', 'Bourbon', 'Geisha', 'Catimor']
});

/**
 * @param {string} cropType - Crop.
 * @param {string} text - Text typed by the producer.
 * @returns {string[]} Varieties of a crop whose name contains a text, ignoring upper case.
 */
export function searchSeedVarieties(cropType, text) {
  const query = text.trim().toLowerCase();
  return SEED_VARIETIES[cropType].filter(variety => variety.toLowerCase().includes(query));
}

/**
 * @param {string} cropType - Crop.
 * @param {string} varietyName - Variety typed by the producer.
 * @returns {boolean} `true` when the variety is not in the catalog of the crop.
 */
export function isCustomSeedVariety(cropType, varietyName) {
  return !SEED_VARIETIES[cropType].includes(varietyName.trim());
}
</script>

<script setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import useFieldManagementStore from "../../application/field-management.store.js";

/**
 * Form of a new crop campaign: crop, variety, sowing date and expected yield
 * (Angular `CampaignForm`, US-32 to US-34, US-40). It validates and emits; the view saves.
 */
const props = defineProps({
  /** Crop of the previous campaign, suggested for the new one. */
  initialCropType: { type: String, default: CropType.ANDEAN_POTATO },
  /** `true` while the campaign is being saved. */
  saving: { type: Boolean, default: false }
});
const emit = defineEmits(['submitted', 'cancel']);
const { t } = useI18n();
const store = useFieldManagementStore();

const cropTypes = Object.values(CropType);
const form = ref({ cropType: props.initialCropType, seedVariety: '', sowingDate: null, expectedYield: null });
const submitted = ref(false);
const varietySuggestions = ref([]);

/** Unit of the expected yield: sacks for potato, quintals for coffee. */
const yieldUnit = computed(() => store.yieldUnitOf(form.value.cropType));

/** Season of the sowing date, e.g. `2026-II`. */
const season = computed(() => form.value.sowingDate ? store.seasonOf(form.value.sowingDate) : '');

/** Validation errors (i18n keys), like the Angular validators. */
const errors = computed(() => {
  const value = form.value;
  const result = {};
  const variety = String(value.seedVariety ?? '');
  if (!variety.trim() || variety.length > 60) result.seedVariety = 'common.required';
  if (!value.sowingDate) result.sowingDate = 'common.required';
  if (value.expectedYield !== null && value.expectedYield < 1) result.expectedYield = 'field-management.plot-form.positive';
  return result;
});

/**
 * Varieties of the selected crop that match what the producer typed (US-34).
 * @param {{query: string}} event - AutoComplete event.
 */
const searchVarieties = (event) => varietySuggestions.value = searchSeedVarieties(form.value.cropType, event.query);

/**
 * @param {string} field - Field name.
 * @returns {string|undefined} Translated error after the first submit.
 */
const errorOf = (field) => submitted.value && errors.value[field] ? t(errors.value[field]) : undefined;

/** Emits the campaign data when the form is valid. */
const onSubmit = () => {
  submitted.value = true;
  if (Object.keys(errors.value).length) return;
  const value = form.value;
  const seedVariety = String(value.seedVariety);
  emit('submitted', {
    cropType: value.cropType,
    seedVariety,
    customVariety: isCustomSeedVariety(value.cropType, seedVariety),
    sowingDate: value.sowingDate,
    season: store.seasonOf(value.sowingDate),
    expectedYield: value.expectedYield,
    yieldUnit: yieldUnit.value
  });
};
</script>

<template>
  <form class="form-grid" novalidate @submit.prevent="onSubmit">
    <fieldset class="sa-field radio-field full">
      <legend class="sa-muted">{{ t('field-management.plot-form.crop-type') }}</legend>
      <div class="flex flex-wrap gap-4 pt-2">
        <label v-for="crop in cropTypes" :key="crop" class="flex align-items-center gap-2">
          <pv-radio-button v-model="form.cropType" :value="crop" name="campaign-crop-type"/>
          {{ t(`field-management.crop-type.${crop}`) }}
        </label>
      </div>
    </fieldset>

    <div class="sa-field">
      <label for="campaign-seed-variety">{{ t('field-management.plot-form.seed-variety') }} *</label>
      <pv-auto-complete v-model="form.seedVariety" input-id="campaign-seed-variety" :suggestions="varietySuggestions"
                        :placeholder="t('field-management.plot-form.variety-placeholder')" :invalid="!!errorOf('seedVariety')"
                        dropdown fluid @complete="searchVarieties"/>
      <small class="sa-muted">{{ t('field-management.plot-form.variety-hint') }}</small>
      <small v-if="errorOf('seedVariety')" class="sa-error">{{ errorOf('seedVariety') }}</small>
    </div>

    <div class="sa-field">
      <label for="campaign-sowing-date">{{ t('field-management.plot-form.sowing-date') }} *</label>
      <pv-date-picker v-model="form.sowingDate" input-id="campaign-sowing-date" date-format="dd/mm/yy" show-icon
                      :invalid="!!errorOf('sowingDate')" fluid/>
      <small v-if="season" class="sa-muted">{{ t('field-management.campaigns.season-hint', { season }) }}</small>
      <small v-if="errorOf('sowingDate')" class="sa-error">{{ errorOf('sowingDate') }}</small>
    </div>

    <div class="sa-field">
      <label for="campaign-expected-yield">{{ t('field-management.plot-form.expected-yield') }}</label>
      <pv-input-group>
        <pv-input-number v-model="form.expectedYield" input-id="campaign-expected-yield" :min="0" placeholder="280"/>
        <pv-input-group-addon>{{ t(`field-management.yield-unit.${yieldUnit}`) }}</pv-input-group-addon>
      </pv-input-group>
      <small v-if="errorOf('expectedYield')" class="sa-error">{{ errorOf('expectedYield') }}</small>
    </div>

    <div class="full flex justify-content-between mt-2">
      <pv-button type="button" outlined class="sa-pill" :label="t('common.cancel')" @click="emit('cancel')"/>
      <pv-button type="submit" class="sa-pill" icon="pi pi-play" :label="t('field-management.campaigns.start')" :disabled="saving"/>
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

.radio-field {
  margin: 0;
  padding: 0;
  border: 0;
}

@media (max-width: 719.98px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
