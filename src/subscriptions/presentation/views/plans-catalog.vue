<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useSubscriptionsStore from "../../application/subscriptions.store.js";
import {SelectSubscriptionPlanCommand} from "../../domain/model/commands/select-subscription-plan.command.js";
import {BillingCycle} from "../../domain/model/entities/billing-cycle.js";
import PageHeader from "../../../shared/presentation/components/page-header.vue";
import MessageCard from "../../../shared/presentation/components/message-card.vue";
import PlanCard from "../components/plan-card.vue";

/** Catalog of available subscription plans and their billing cycles (Angular `PlansCatalogView`). */
const { t } = useI18n();
const router = useRouter();
const store = useSubscriptionsStore();

/** Breadcrumb path for the catalog page. */
const breadcrumbs = [{ label: 'subscriptions.catalog.title' }];

/** Billing cycles offered by the catalog toggle. */
const cycles = Object.values(BillingCycle);

/** Updates the cycle selected for displaying plan prices. */
const cycle = computed({
  get: () => store.billingCycle,
  set: value => { if (value && value !== store.billingCycle) store.toggleBillingCycle(); }
});

// Load both the catalog and the current subscription to highlight its plan.
if (store.currentUserId !== null) store.loadMySubscription(store.currentUserId);

/**
 * Creates the selection command for the signed-in user.
 * @param {import('../../domain/model/entities/plan.entity.js').Plan} plan - Plan chosen.
 */
const onSelectPlan = (plan) => {
  const userId = store.currentUserId;
  if (userId === null) return;
  store.selectPlan(new SelectSubscriptionPlanCommand({ userId, planCode: plan.code, billingCycle: store.billingCycle }));
  if (store.selectedPlan?.code === plan.code) router.push('/subscriptions/checkout');
};
</script>

<template>
  <div class="page">
    <pv-progress-bar v-if="store.loading" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>

    <page-header :breadcrumbs="breadcrumbs" :title="t('subscriptions.catalog.title')" :subtitle="t('subscriptions.catalog.subtitle')"/>

    <message-card v-if="store.error" icon="pi pi-times-circle" :message="t(store.error)" alert/>

    <section class="cycle-picker" :aria-label="t('subscriptions.catalog.billing-cycle')">
      <span>{{ t('subscriptions.catalog.billing-cycle') }}</span>
      <pv-select-button v-model="cycle" :options="cycles" :allow-empty="false" :aria-label="t('subscriptions.catalog.billing-cycle')">
        <template #option="{ option }">{{ t(`subscriptions.billing-cycle.${option}`) }}</template>
      </pv-select-button>
    </section>

    <section class="plan-grid" :aria-label="t('subscriptions.catalog.title')">
      <plan-card
          v-for="plan in store.plans"
          :key="plan.id"
          :plan="plan"
          :cycle="store.billingCycle"
          :current="store.subscription?.hasAccess() === true && store.subscription?.planId === plan.id"
          :selected="store.selectedPlan?.code === plan.code"
          :disabled="store.loading"
          @choose="onSelectPlan"/>
      <message-card v-if="store.plans.length === 0 && !store.loading && !store.error" icon="pi pi-box"
                    :message="t('subscriptions.catalog.empty')"/>
    </section>
  </div>
</template>

<style scoped>
.cycle-picker {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  align-items: stretch;
  gap: 20px;
}
</style>
