<script>
import {Money} from "../../../shared/domain/model/money.js";

/**
 * One campaign of a plot with the main figures of its cost ledger (`CampaignSummary`).
 *
 * @typedef {Object} CampaignSummary
 * @property {number} campaignId
 * @property {number} plotId
 * @property {string} season
 * @property {string} cropType
 * @property {string} seedVariety
 * @property {Date|null} sowingDate
 * @property {string} status
 * @property {boolean} isActive - `true` while the campaign is in progress.
 * @property {number|null} ledgerId - `null` when the campaign has no cost ledger yet.
 * @property {Money} totalInvestment
 * @property {Money} breakevenPrice
 * @property {number} expectedYield
 * @property {number|null} actualYield
 * @property {string} yieldUnit
 * @property {number} expenseCount
 * @property {Money} costPerHectare
 * @property {number|null} yieldAchievement - Actual yield compared with the expected one, in % (100 = as expected), or `null`.
 */

/**
 * Builds the summary of a campaign.
 * @param {Object} store - Field Management store, which knows the yield unit of each crop.
 * @param {import('../../domain/model/entities/crop-campaign.entity.js').CropCampaign} campaign - The campaign.
 * @param {import('../../domain/model/entities/campaign-ledger.entity.js').CampaignLedger|null} ledger - Its cost ledger, if it has one.
 * @param {number} areaHectares - Area of the plot, for the cost per hectare.
 * @returns {CampaignSummary} Summary of the campaign.
 */
export function campaignSummaryOf(store, campaign, ledger, areaHectares) {
  const expectedYield = ledger?.expectedYield ?? 0;
  const actualYield = ledger?.actualYield ?? null;
  return {
    campaignId: campaign.id,
    plotId: campaign.plotId,
    season: campaign.season,
    cropType: campaign.cropType,
    seedVariety: campaign.seedVariety,
    sowingDate: campaign.sowingDate,
    status: campaign.status,
    isActive: campaign.isActive(),
    ledgerId: ledger ? ledger.id : null,
    totalInvestment: ledger ? ledger.totalInvestment() : new Money(0),
    breakevenPrice: ledger ? ledger.breakevenPrice() : new Money(0),
    expectedYield,
    actualYield,
    yieldUnit: ledger?.yieldUnit ?? store.yieldUnitOf(campaign.cropType),
    expenseCount: ledger?.entries.length ?? 0,
    costPerHectare: ledger ? ledger.costPerHectare(areaHectares) : new Money(0),
    yieldAchievement: actualYield === null || expectedYield <= 0 ? null : (actualYield / expectedYield) * 100
  };
}
</script>

<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {formatDate, formatNumber} from "../../../shared/presentation/format.js";

/** Card of one campaign of the plot: crop, sowing, investment and yield (Angular `CampaignSummaryCard`). */
const props = defineProps({
  /** @type {CampaignSummary} */
  summary: { type: Object, required: true },
  /** `true` while a change is being saved. */
  saving: { type: Boolean, default: false }
});
const emit = defineEmits(['close-campaign', 'export-report']);
const { t, locale } = useI18n();

const unit = computed(() => t(`field-management.yield-unit.${props.summary.yieldUnit}`));
</script>

<template>
  <pv-card class="summary-card sa-card" :class="{ active: summary.isActive }">
    <template #title>
      <div class="card-header">
        <i :class="summary.isActive ? 'pi pi-sun' : 'pi pi-box'" class="text-3xl title-icon" aria-hidden="true"/>
        <div class="flex flex-column">
          <span class="text-lg">{{ t('field-management.dashboard.campaign') }} {{ summary.season }}</span>
          <span class="sa-muted text-sm font-normal">
            {{ t(`field-management.crop-type.${summary.cropType}`) }} – {{ summary.seedVariety }}
          </span>
        </div>
        <span class="sa-chip status" :class="{ muted: !summary.isActive }">
          {{ t(`field-management.campaign-status.${summary.status}`) }}
        </span>
      </div>
    </template>
    <template #content>
      <dl class="figures">
        <div>
          <dt>{{ t('field-management.campaigns.sowing-date') }}</dt>
          <dd>{{ summary.sowingDate ? formatDate(summary.sowingDate, locale) : t('field-management.campaigns.not-sown') }}</dd>
        </div>
        <div>
          <dt>{{ t('field-management.finances.total-invested') }}</dt>
          <dd>{{ summary.totalInvestment.format() }}</dd>
        </div>
        <div>
          <dt>{{ t('field-management.reports.cost-per-hectare') }}</dt>
          <dd>{{ summary.costPerHectare.format() }}</dd>
        </div>
        <div>
          <dt>{{ t('field-management.finances.breakeven-title') }}</dt>
          <dd>{{ summary.breakevenPrice.format() }}</dd>
        </div>
        <div>
          <dt>{{ t('field-management.finances.expected-yield') }}</dt>
          <dd>{{ formatNumber(summary.expectedYield, locale) }} {{ unit }}</dd>
        </div>
        <div>
          <dt>{{ t('field-management.reports.actual-yield') }}</dt>
          <dd>
            <template v-if="summary.actualYield !== null">
              {{ formatNumber(summary.actualYield, locale) }} {{ unit }}
              <span v-if="summary.yieldAchievement" class="achievement">({{ formatNumber(summary.yieldAchievement, locale, 0) }}%)</span>
            </template>
            <template v-else>—</template>
          </dd>
        </div>
      </dl>
      <p class="sa-muted m-0">{{ t('field-management.campaigns.expense-count', { count: summary.expenseCount }) }}</p>
    </template>
    <template #footer>
      <pv-divider class="mt-0"/>
      <div class="flex justify-content-end gap-2">
        <pv-button v-if="summary.ledgerId !== null" text icon="pi pi-download" :label="t('field-management.reports.export')"
                   @click="emit('export-report', summary)"/>
        <pv-button v-if="summary.isActive" icon="pi pi-check-circle" :label="t('field-management.campaigns.close')" :disabled="saving"
                   @click="emit('close-campaign', summary)"/>
      </div>
    </template>
  </pv-card>
</template>

<style scoped>
.summary-card {
  min-width: 0;
}

.summary-card.active {
  border: 2px solid var(--sa-primary);
}

.card-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.title-icon {
  color: var(--sa-primary);
}

.status {
  margin-left: auto;
}

.status.muted {
  background: var(--sa-surface-container-high);
  color: var(--sa-on-surface);
}

.figures {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin: 8px 0;
}

.figures dt {
  color: var(--sa-on-surface-variant);
  font-size: 12px;
  font-weight: 500;
}

.figures dd {
  margin: 4px 0 0;
  font-size: 16px;
  font-weight: 600;
}

.achievement {
  color: var(--sa-on-surface-variant);
  font-size: 12px;
  font-weight: 400;
}
</style>
