<script setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {Money} from "../../../shared/domain/model/money.js";

/**
 * `BreakevenReport` read model: breakeven price with the expected and the
 * actual yield, a suggested price with margin and a profit simulator
 * (Angular `BreakevenReportCard`, US-40).
 */
const props = defineProps({
  /** @type {import('../../domain/model/entities/campaign-ledger.entity.js').CampaignLedger} */
  ledger: { type: Object, required: true }
});
const { t } = useI18n();

/** Profit margin chosen by the producer, in %. */
const margin = ref(15);

/** Price per unit offered by the buyer, typed by the producer. */
const salePrice = ref(null);

/** Breakeven price with the expected and with the actual yield (`BreakevenReport`). */
const report = computed(() => {
  const ledger = props.ledger;
  return {
    totalInvestment: ledger.totalInvestment(),
    yieldUnit: ledger.yieldUnit,
    expectedBreakevenPrice: ledger.breakevenPriceFor(ledger.expectedYield),
    actualBreakevenPrice: ledger.actualYield === null ? null : ledger.breakevenPriceFor(ledger.actualYield),
    calculable: ledger.referenceYield() > 0
  };
});

const perUnit = computed(() => t(`field-management.yield-unit.per-${report.value.yieldUnit}`));

const suggestedPrice = computed(() => props.ledger.suggestedPrice(margin.value));

/** Profit (or loss) selling the whole harvest at the typed price. */
const profit = computed(() => {
  const price = salePrice.value;
  if (price === null || price <= 0) return null;
  const amount = price * props.ledger.referenceYield() - report.value.totalInvestment.amount;
  return { amount, money: new Money(Math.abs(amount), props.ledger.currency) };
});
</script>

<template>
  <pv-card class="report-card sa-card h-full">
    <template #title>
      <span class="flex align-items-center gap-3 text-lg">
        <i class="pi pi-chart-line text-3xl title-icon" aria-hidden="true"/>{{ t('field-management.reports.breakeven-title') }}
      </span>
    </template>
    <template #subtitle>{{ t('field-management.reports.breakeven-subtitle') }}</template>
    <template #content>
      <template v-if="report.calculable">
        <div class="prices">
          <div class="price-box">
            <span class="label">{{ t('field-management.reports.with-expected-yield') }}</span>
            <span class="price">{{ report.expectedBreakevenPrice.format() }}</span>
            <span class="unit">{{ perUnit }}</span>
          </div>
          <div class="price-box" :class="{ muted: !report.actualBreakevenPrice }">
            <span class="label">{{ t('field-management.reports.with-actual-yield') }}</span>
            <span class="price">{{ report.actualBreakevenPrice?.format() ?? '—' }}</span>
            <span class="unit">{{ perUnit }}</span>
          </div>
        </div>

        <section class="simulator" :aria-label="t('field-management.reports.simulator')">
          <label id="margin-label" class="slider-label">{{ t('field-management.reports.margin', { margin }) }}</label>
          <pv-slider v-model="margin" :min="0" :max="60" :step="5" aria-labelledby="margin-label" class="mx-2 my-3"/>
          <p class="suggested">{{ t('field-management.reports.suggested', { price: suggestedPrice.format(), unit: perUnit }) }}</p>

          <div class="sa-field">
            <label for="sale-price">{{ t('field-management.reports.sale-price') }}</label>
            <pv-input-group>
              <pv-input-number v-model="salePrice" input-id="sale-price" mode="currency" currency="PEN" locale="es-PE"
                               :min="0" :step="0.5"/>
              <pv-input-group-addon>{{ perUnit }}</pv-input-group-addon>
            </pv-input-group>
          </div>
          <p v-if="profit" class="result" :class="{ loss: profit.amount < 0 }" role="status">
            <i :class="profit.amount < 0 ? 'pi pi-arrow-down-right' : 'pi pi-wallet'" aria-hidden="true"/>
            {{ t(profit.amount < 0 ? 'field-management.reports.loss' : 'field-management.reports.profit', { amount: profit.money.format() }) }}
          </p>
        </section>
      </template>
      <p v-else class="sa-muted">{{ t('field-management.finances.yield-required') }}</p>
    </template>
  </pv-card>
</template>

<style scoped>
.report-card {
  min-width: 0;
}

.title-icon {
  color: var(--sa-primary);
}

.prices {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin: 16px 0;
}

.price-box {
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: 16px;
  background: var(--sa-secondary-container);
  color: var(--sa-on-secondary-container);
}

.price-box.muted {
  background: var(--sa-surface-container-high);
  color: var(--sa-on-surface-variant);
}

.label,
.slider-label {
  font-size: 14px;
  font-weight: 500;
}

.price {
  font-size: 28px;
  font-weight: 700;
}

.unit {
  font-size: 12px;
}

.simulator {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggested {
  margin: 0 0 8px;
  color: var(--sa-primary);
  font-size: 16px;
  font-weight: 500;
}

.result {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 0;
  color: var(--sa-primary);
  font-size: 16px;
  font-weight: 500;
}

.result.loss {
  color: var(--sa-error);
}
</style>
