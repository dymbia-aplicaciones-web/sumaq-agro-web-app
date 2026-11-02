<script setup>
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {formatDate, formatNumber} from "../../../shared/presentation/format.js";
import {CropType} from "../../domain/model/entities/crop-campaign.entity.js";

/** Initial soil analysis of the plot, with the advice the domain gives for its crop (Angular `SoilBaselineCard`). */
defineProps({
  /** @type {import('../../domain/model/entities/field-plot.entity.js').SoilBaseline|null} Soil analysis, or `null` if it was not recorded. */
  soilBaseline: { type: Object, default: null },
  /** Crop of the current campaign, for the advice. */
  cropType: { type: String, default: null },
  /** Route of the soil analysis form. */
  recordLink: { type: [String, Object], required: true }
});
const { t, locale } = useI18n();
const router = useRouter();

/** Lowest pH each crop tolerates before the soil needs lime. */
const MINIMUM_PH = Object.freeze({
  [CropType.ANDEAN_POTATO]: 5.5,
  [CropType.SPECIALTY_COFFEE]: 5.0
});

/** `true` when the soil is too acid for the crop and needs lime before sowing. */
const needsLiming = (soil, cropType) => soil.ph < MINIMUM_PH[cropType];

/** `true` when the soil has less than 2 % of organic matter and needs compost. */
const isLowInOrganicMatter = (soil) => soil.organicMatterPercentage < 2;
</script>

<template>
  <pv-card class="soil-card sa-card">
    <template #title>
      <span class="flex align-items-center gap-3 text-lg">
        <i class="pi pi-list-check text-3xl title-icon" aria-hidden="true"/>{{ t('field-management.soil.title') }}
      </span>
    </template>
    <template v-if="soilBaseline" #subtitle>
      {{ t('field-management.soil.recorded-at', { date: formatDate(soilBaseline.recordedAt, locale) }) }}
    </template>
    <template #content>
      <template v-if="soilBaseline">
        <dl class="values">
          <div>
            <dt>{{ t('field-management.soil.ph') }}</dt>
            <dd>{{ formatNumber(soilBaseline.ph, locale, 2, 1) }}</dd>
          </div>
          <div>
            <dt>{{ t('field-management.soil.texture') }}</dt>
            <dd>{{ t(`field-management.soil-texture.${soilBaseline.texture}`) }}</dd>
          </div>
          <div>
            <dt>{{ t('field-management.soil.organic-matter') }}</dt>
            <dd>{{ formatNumber(soilBaseline.organicMatterPercentage, locale, 2, 1) }} %</dd>
          </div>
        </dl>

        <ul class="advice">
          <template v-if="cropType">
            <li v-if="needsLiming(soilBaseline, cropType)" class="warn">
              <i class="pi pi-exclamation-triangle" aria-hidden="true"/>
              {{ t('field-management.soil.needs-liming', { crop: t(`field-management.crop-type.${cropType}`) }) }}
            </li>
            <li v-else>
              <i class="pi pi-check-circle" aria-hidden="true"/>
              {{ t('field-management.soil.ph-ok', { crop: t(`field-management.crop-type.${cropType}`) }) }}
            </li>
          </template>
          <li v-if="isLowInOrganicMatter(soilBaseline)" class="warn">
            <i class="pi pi-box" aria-hidden="true"/>
            {{ t('field-management.soil.low-organic-matter') }}
          </li>
        </ul>
      </template>
      <p v-else class="sa-muted">{{ t('field-management.soil.empty') }}</p>
    </template>
    <template #footer>
      <div class="flex justify-content-end">
        <pv-button outlined icon="pi pi-list-check" :label="t(soilBaseline ? 'field-management.soil.update' : 'field-management.soil.record')"
                   @click="router.push(recordLink)"/>
      </div>
    </template>
  </pv-card>
</template>

<style scoped>
.soil-card {
  min-width: 0;
}

.title-icon {
  color: var(--sa-primary);
}

.values {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin: 16px 0;
}

.values dt {
  color: var(--sa-on-surface-variant);
  font-size: 12px;
  font-weight: 500;
}

.values dd {
  margin: 4px 0 0;
  font-size: 20px;
  font-weight: 600;
}

.advice {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.advice li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.advice i {
  flex-shrink: 0;
  margin-top: 3px;
  color: var(--sa-primary);
}

.advice .warn i {
  color: var(--sa-error);
}
</style>
