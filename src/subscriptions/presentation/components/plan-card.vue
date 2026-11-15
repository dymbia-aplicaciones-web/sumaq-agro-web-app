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
  <article class="plan-card" :class="{current, selected}">
    <header class="plan-heading">
      <span class="plan-icon"><i class="pi pi-verified" aria-hidden="true"/></span>
      <div>
        <p>{{ t(`subscriptions.segment.${plan.code}`) }}</p>
        <h2>{{ t(`subscriptions.plan-code.${plan.code}`) }}</h2>
      </div>
    </header>
    <p class="price">
      <strong>{{ plan.priceFor(cycle).format() }}</strong>
      <span>/ {{ t(`subscriptions.billing-cycle.${cycle}`) }}</span>
    </p>
    <p v-if="cycle === BillingCycle.ANNUAL && plan.annualSavings().amount > 0" class="savings">
      <i class="pi pi-wallet" aria-hidden="true"/>
      {{ t('subscriptions.plans.annual-savings', {amount: plan.annualSavings().format()}) }}
    </p>
    <p class="quota"><i class="pi pi-map" aria-hidden="true"/> {{ t('subscriptions.plans.plot-quota', {quota: plan.plotQuota}) }}</p>
    <ul>
      <li v-for="feature in plan.features" :key="feature">
        <i class="pi pi-check" aria-hidden="true"/> {{ t(`subscriptions.features.${feature}`) }}
      </li>
    </ul>
    <pv-button class="plan-action" type="button" :disabled="disabled || current"
               :icon="current ? undefined : 'pi pi-arrow-right'" icon-pos="right"
               :label="t(current ? 'subscriptions.plans.current' : 'subscriptions.plans.choose')"
               @click="emit('choose', plan)"/>
    <p class="note"><i class="pi pi-calendar" aria-hidden="true"/> {{ t('subscriptions.plans.cancel-note') }}</p>
  </article>
</template>

<style scoped>
.plan-card { padding: clamp(20px, 4vw, 32px); border: 1px solid #bcc4b5; border-radius: 28px; background: #f7f8f0; box-shadow: 0 2px 6px #20261b45; color: #191d17; }
.plan-card.current, .plan-card.selected { border-color: var(--sa-primary); }
.plan-heading, .quota, li, .note { display: flex; align-items: center; gap: 12px; }
.plan-heading p { margin: 0 0 4px; color: #076600; font-weight: 500; }
.plan-heading h2 { margin: 0; font-size: clamp(1.2rem, 4vw, 1.75rem); line-height: 1.2; }
.plan-icon { width: 52px; height: 52px; border-radius: 16px; display: grid; place-items: center; flex-shrink: 0; background: #e6e8df; color: #076600; font-size: 1.25rem; }
.price { display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px; margin: 20px 0 4px; }
.price strong { font-size: clamp(1.85rem, 6vw, 2.8rem); line-height: 1.2; }
.savings { display: inline-flex; align-items: center; gap: 8px; border-radius: 999px; padding: 4px 12px; margin: 4px 0 0; background: #d5e7cd; }
.quota { margin: 24px 0; padding: 12px 0; border-block: 1px solid #bcc4b5; }
.quota i, li i { color: #076600; }
ul { display: grid; gap: 12px; padding: 0; margin: 0 0 28px; list-style: none; }
.plan-action.p-button { width: 100%; min-height: 52px; border-radius: 999px; justify-content: center; background: #076600; border-color: #076600; }
.plan-action :deep(.p-button-label) { flex: 0 0 auto; }
.note { margin: 12px 0 0; font-size: .75rem; text-align: center; }
</style>
