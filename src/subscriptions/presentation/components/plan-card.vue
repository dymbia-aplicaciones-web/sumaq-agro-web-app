<script setup>
import {useI18n} from "vue-i18n";
import {BillingCycle} from "../../domain/model/entities/billing-cycle.js";

/** Displays one subscription plan and emits the user's selection (Angular `PlanCard`). */
defineProps({
  /** @type {import('../../domain/model/entities/plan.entity.js').Plan} Plan shown in the card. */
  plan: { type: Object, required: true },
  /** Billing cycle of the prices. */
  cycle: { type: String, required: true },
  /** `true` when this plan is the active one. */
  current: { type: Boolean, default: false },
  /** `true` when this plan is selected for checkout. */
  selected: { type: Boolean, default: false },
  /** Disables selection while catalog data is loading. */
  disabled: { type: Boolean, default: false }
});
/** `choose`: the user wants to select this plan. */
const emit = defineEmits(['choose']);
const { t } = useI18n();
</script>

<template>
  <pv-card class="plan-card sa-card" :class="{ current, selected }">
    <template #title>
      <span class="flex align-items-center gap-3 text-lg">
        <i :class="current ? 'pi pi-check-circle' : 'pi pi-verified'" class="text-3xl title-icon" aria-hidden="true"/>
        {{ t(`subscriptions.plan-code.${plan.code}`) }}
      </span>
    </template>
    <template v-if="current || selected" #subtitle>
      {{ t(current ? 'subscriptions.plans.current' : 'subscriptions.plans.selected') }}
    </template>
    <template #content>
      <p class="price">
        <strong>{{ plan.priceFor(cycle).format() }}</strong>
        <span class="sa-muted"> / {{ t(`subscriptions.billing-cycle.${cycle}`) }}</span>
      </p>
      <p v-if="cycle === BillingCycle.ANNUAL && plan.annualSavings().amount > 0" class="sa-muted savings">
        {{ t('subscriptions.plans.annual-savings', { amount: plan.annualSavings().format() }) }}
      </p>
      <p class="quota">
        <i class="pi pi-map" aria-hidden="true"/>
        {{ t('subscriptions.plans.plot-quota', { quota: plan.plotQuota }) }}
      </p>
      <ul>
        <li v-for="feature in plan.features" :key="feature">
          <i class="pi pi-check" aria-hidden="true"/>
          {{ t(`subscriptions.features.${feature}`) }}
        </li>
      </ul>
    </template>
    <template #footer>
      <pv-button class="w-full" :disabled="disabled || current || selected" @click="emit('choose', plan)"
                 :label="t(current ? 'subscriptions.plans.current' : selected ? 'subscriptions.plans.selected' : 'subscriptions.plans.choose')"/>
    </template>
  </pv-card>
</template>

<style scoped>
.plan-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.plan-card :deep(.p-card-body),
.plan-card :deep(.p-card-content) {
  flex: 1;
}

.plan-card.current {
  border-color: var(--sa-primary);
  background: var(--sa-secondary-container);
}

.plan-card.selected {
  border: 2px solid var(--sa-tertiary);
}

.title-icon,
.quota i,
li i {
  flex: none;
  color: var(--sa-primary);
}

.price {
  margin: 20px 0 4px;
}

.price strong {
  font-size: 2rem;
}

.savings {
  margin: 0 0 16px;
}

.quota,
li {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quota {
  margin: 20px 0;
  font-weight: 600;
}

ul {
  display: grid;
  gap: 12px;
  padding: 0;
  list-style: none;
}
</style>
