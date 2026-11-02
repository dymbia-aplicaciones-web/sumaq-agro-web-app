<script setup>
import {ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useSubscriptionsStore from "../../application/subscriptions.store.js";
import {CancelSubscriptionCommand} from "../../domain/model/commands/cancel-subscription.command.js";
import {formatDate} from "../../../shared/presentation/format.js";
import PageHeader from "../../../shared/presentation/components/page-header.vue";
import MessageCard from "../../../shared/presentation/components/message-card.vue";

/** Current subscription and payment history of the signed-in user (Angular `BillingHistoryView`). */
const { t, locale } = useI18n();
const router = useRouter();
const store = useSubscriptionsStore();

/** Shows the second confirmation step before cancelling renewal. */
const confirmingCancellation = ref(false);

const breadcrumbs = [
  { label: 'subscriptions.catalog.title', link: '/subscriptions/plans' },
  { label: 'subscriptions.billing.title' }
];

if (store.currentUserId !== null) store.loadMySubscription(store.currentUserId);

/**
 * @param {number|string|null|undefined} id - Identifier.
 * @returns {number|null} Numeric identifier, or `null`.
 */
const numericId = (id) => {
  if (id === null || id === undefined || id === '') return null;
  const value = Number(id);
  return Number.isFinite(value) ? value : null;
};

/** Cancels renewal only after the user confirms the action. */
const onCancelSubscription = () => {
  const subscriptionId = numericId(store.subscription?.id);
  if (subscriptionId === null || store.processing) return;
  store.cancelSubscription(new CancelSubscriptionCommand({ subscriptionId }));
  confirmingCancellation.value = false;
};

/** @param {number|string|null} id - Payment of the receipt. */
const onDownloadReceipt = (id) => {
  const paymentId = numericId(id);
  if (paymentId !== null) store.downloadReceipt(paymentId);
};
</script>

<template>
  <div class="page">
    <pv-progress-bar v-if="store.loading" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>

    <page-header :breadcrumbs="breadcrumbs" :title="t('subscriptions.billing.title')" :subtitle="t('subscriptions.billing.subtitle')">
      <pv-button outlined :label="t('subscriptions.billing.change-plan')" @click="router.push('/subscriptions/plans')"/>
    </page-header>

    <message-card v-if="store.error" icon="pi pi-times-circle" :message="t(store.error)" alert/>

    <pv-card v-if="store.subscription" class="subscription-card sa-card">
      <template #title>
        <span class="flex align-items-center gap-3 text-lg">
          <i class="pi pi-verified text-3xl title-icon" aria-hidden="true"/>
          {{ store.subscription.plan ? t(`subscriptions.plan-code.${store.subscription.plan.code}`) : t('subscriptions.billing.unknown-plan') }}
        </span>
      </template>
      <template #subtitle>{{ t(`subscriptions.subscription-status.${store.subscription.status}`) }}</template>
      <template #content>
        <dl>
          <div>
            <dt>{{ t('subscriptions.billing.cycle') }}</dt>
            <dd>{{ t(`subscriptions.billing-cycle.${store.subscription.billingCycle}`) }}</dd>
          </div>
          <div>
            <dt>{{ t('subscriptions.billing.started') }}</dt>
            <dd>{{ formatDate(store.subscription.startDate, locale) }}</dd>
          </div>
          <div>
            <dt>{{ t('subscriptions.billing.ends') }}</dt>
            <dd>{{ store.subscription.endDate ? formatDate(store.subscription.endDate, locale) : t('subscriptions.billing.no-end-date') }}</dd>
          </div>
          <div>
            <dt>{{ t('subscriptions.billing.plot-quota') }}</dt>
            <dd>{{ store.subscription.plan?.plotQuota ?? 0 }}</dd>
          </div>
        </dl>

        <template v-if="store.subscription.hasAccess() && store.subscription.autoRenew">
          <section v-if="confirmingCancellation" class="cancel-confirmation" role="group" :aria-label="t('subscriptions.billing.cancel-confirmation')">
            <p>{{ t('subscriptions.billing.cancel-confirmation') }}</p>
            <div class="cancel-actions">
              <pv-button text :label="t('subscriptions.billing.keep')" :disabled="store.processing" @click="confirmingCancellation = false"/>
              <pv-button severity="danger" :label="t('subscriptions.billing.confirm-cancel')" :disabled="store.processing" @click="onCancelSubscription"/>
            </div>
          </section>
          <pv-button v-else outlined :label="t('subscriptions.billing.cancel')" :disabled="store.processing" @click="confirmingCancellation = true"/>
        </template>
        <p v-else-if="store.subscription.hasAccess()" class="sa-muted">{{ t('subscriptions.billing.cancelled-until') }}</p>
        <p v-else class="sa-muted">{{ t('subscriptions.billing.expired') }}</p>
      </template>
    </pv-card>
    <message-card v-else-if="!store.loading && !store.error" icon="pi pi-verified" :message="t('subscriptions.billing.no-subscription')">
      <template #actions>
        <pv-button :label="t('subscriptions.billing.browse-plans')" @click="router.push('/subscriptions/plans')"/>
      </template>
    </message-card>

    <section class="payments-section">
      <h2>{{ t('subscriptions.billing.payment-history') }}</h2>
      <div v-if="store.payments.length" class="payment-list">
        <pv-card v-for="payment in store.payments" :key="payment.id" class="sa-card">
          <template #content>
            <div class="payment-row">
              <dl class="payment-details">
                <div>
                  <dt>{{ t('subscriptions.billing.amount') }}</dt>
                  <dd>{{ payment.amount.format() }}</dd>
                </div>
                <div>
                  <dt>{{ t('subscriptions.billing.date') }}</dt>
                  <dd>{{ formatDate(payment.paidAt, locale) }}</dd>
                </div>
                <div>
                  <dt>{{ t('subscriptions.billing.status') }}</dt>
                  <dd>{{ t(`subscriptions.payment-status.${payment.status}`) }}</dd>
                </div>
                <div>
                  <dt>{{ t('subscriptions.billing.transaction') }}</dt>
                  <dd class="transaction-token">{{ payment.transactionToken }}</dd>
                </div>
              </dl>
              <pv-button outlined icon="pi pi-download" :label="t('subscriptions.billing.download-receipt')"
                         :aria-label="t('subscriptions.billing.download-receipt')" @click="onDownloadReceipt(payment.id)"/>
            </div>
          </template>
        </pv-card>
      </div>
      <message-card v-else-if="!store.loading && !store.error" icon="pi pi-receipt" :message="t('subscriptions.billing.no-payments')"/>
    </section>
  </div>
</template>

<style scoped>
.subscription-card {
  max-width: 760px;
}

.title-icon {
  color: var(--sa-primary);
}

dl {
  display: grid;
  gap: 16px;
  margin: 8px 0 24px;
}

dl div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

dt {
  color: var(--sa-on-surface-variant);
}

dd {
  margin: 0;
  font-weight: 600;
  text-align: right;
}

.cancel-confirmation {
  padding: 16px;
  border-radius: 12px;
  background: var(--sa-error-container);
}

.cancel-confirmation p {
  margin-top: 0;
}

.cancel-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.payments-section {
  display: grid;
  gap: 16px;
}

.payments-section h2 {
  margin: 0;
}

.payment-list {
  display: grid;
  gap: 12px;
}

.payment-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.payment-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  flex: 1;
  gap: 12px 24px;
  margin: 0;
}

.transaction-token {
  overflow-wrap: anywhere;
}

@media (max-width: 720px) {
  .payment-row {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 480px) {
  .payment-details {
    grid-template-columns: 1fr;
  }
}
</style>
