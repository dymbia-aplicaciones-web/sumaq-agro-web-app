<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import useSubscriptionsStore from "../../application/subscriptions.store.js";
import {SelectSubscriptionPlanCommand} from "../../domain/model/commands/select-subscription-plan.command.js";
import {BillingCycle} from "../../domain/model/entities/billing-cycle.js";
import MessageCard from "../../../shared/presentation/components/message-card.vue";
import PlanCard from "../components/plan-card.vue";

/** Catalog of available subscription plans and their billing cycles (Angular `PlansCatalogView`). */
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const store = useSubscriptionsStore();


/** Billing cycles offered by the catalog toggle. */
const cycles = Object.values(BillingCycle);

/** Updates the cycle selected for displaying plan prices. */
const cycle = computed({
  get: () => store.billingCycle,
  set: value => { if (value && value !== store.billingCycle) store.toggleBillingCycle(); }
});

// Load both the catalog and the current subscription to highlight its plan.
if (store.currentUserId !== null) store.loadMySubscription(store.currentUserId, false);

/**
 * Creates the selection command for the signed-in user.
 * @param {import('../../domain/model/entities/plan.entity.js').Plan} plan - Plan chosen.
 */
const onSelectPlan = (plan) => {
  const userId = store.currentUserId;
  if (userId === null) return;
  if (store.selectedPlan?.code === plan.code) {
    void router.push({ name: 'subscriptions-checkout' });
    return;
  }
  const accepted = store.selectPlan(new SelectSubscriptionPlanCommand({ userId, planCode: plan.code, billingCycle: store.billingCycle }));
  if (accepted) router.push({ name: 'subscriptions-checkout' });
};
</script>

<template>
  <div class="page">
    <pv-progress-bar v-if="store.loading" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>

    <header class="catalog-heading">
      <span>{{ t('subscriptions.catalog.eyebrow') }}</span>
      <h1>{{ t('subscriptions.catalog.title') }}</h1>
      <p>{{ t('subscriptions.catalog.subtitle') }}</p>
    </header>

    <message-card v-if="route.query.accessCheck === 'failed'" icon="pi pi-exclamation-triangle"
                  :message="t('subscriptions.catalog.access-check-failed')" alert/>
    <message-card v-if="store.error" icon="pi pi-times-circle" :message="t(store.error)" alert/>

    <section class="cycle-picker" :aria-label="t('subscriptions.catalog.billing-cycle')">
      <pv-select-button v-model="cycle" :options="cycles" :allow-empty="false" :aria-label="t('subscriptions.catalog.billing-cycle')">
        <template #option="{ option }">
          <i v-if="cycle === option" class="pi pi-check" aria-hidden="true"/>
          {{ t(`subscriptions.billing-cycle.${option}`) }}
          <small v-if="option === BillingCycle.ANNUAL && store.eligiblePlans.some(plan => plan.annualSavings().amount > 0)" class="annual-tag">{{ t('subscriptions.catalog.annual-tag') }}</small>
        </template>
      </pv-select-button>
    </section>

    <section class="plan-grid" :aria-label="t('subscriptions.catalog.title')">
      <plan-card
          v-for="plan in store.eligiblePlans"
          :key="plan.id"
          :plan="plan"
          :cycle="store.billingCycle"
          :current="store.subscription?.hasAccess() === true && store.subscription?.planId === plan.id"
          :selected="store.selectedPlan?.code === plan.code"
          :disabled="store.loading || !store.plotQuotaReady"
          @choose="onSelectPlan"/>
      <message-card v-if="store.eligiblePlans.length === 0 && !store.loading && !store.error" icon="pi pi-box"
                    :message="t('subscriptions.catalog.empty')"/>
    </section>
  </div>
</template>

<style scoped>
.catalog-heading { text-align: center; margin: 6px auto 28px; max-width: 570px; }
.catalog-heading span { color: #076600; font-size: .8rem; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; }
.catalog-heading h1 { margin: 8px 0; font-size: clamp(1.75rem, 5vw, 2.25rem); }
.catalog-heading p { margin: 0; }
.cycle-picker { display: flex; justify-content: center; margin-bottom: 28px; }
.cycle-picker :deep(.p-selectbutton) { border: 1px solid #80887a; border-radius: 999px; overflow: hidden; }
.cycle-picker :deep(.p-togglebutton) { border: 0; border-radius: 0; gap: 8px; background: transparent; }
.cycle-picker :deep(.p-togglebutton-checked) { background: #d5e7cd; }
.annual-tag { background: #d5e7cd; border-radius: 999px; padding: 2px 8px; }
.plan-grid { width: min(100%, 460px); margin-inline: auto; display: grid; gap: 16px; }
</style>
