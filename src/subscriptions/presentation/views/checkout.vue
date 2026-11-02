<script setup>
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useSubscriptionsStore from "../../application/subscriptions.store.js";
import {ApplyCouponCommand} from "../../domain/model/commands/apply-coupon.command.js";
import {SubmitPaymentCommand} from "../../domain/model/commands/submit-payment.command.js";
import {PaymentStatus} from "../../domain/model/entities/payment-status.js";
import PageHeader from "../../../shared/presentation/components/page-header.vue";
import MessageCard from "../../../shared/presentation/components/message-card.vue";
import CouponForm from "../components/coupon-form.vue";

/** Checkout summary and demo payment flow for a selected plan (Angular `CheckoutView`). */
const { t } = useI18n();
const router = useRouter();
const store = useSubscriptionsStore();

const breadcrumbs = [
  { label: 'subscriptions.catalog.title', link: '/subscriptions/plans' },
  { label: 'subscriptions.checkout.title' }
];

/** @returns {number|null} Numeric subscription id expected by the payment commands. */
const subscriptionId = () => {
  const id = Number(store.subscription?.id);
  return store.subscription && Number.isFinite(id) ? id : null;
};

/**
 * Applies a coupon through the subscriptions store.
 * @param {string} code - Promotional code.
 */
const onApplyCoupon = (code) => store.applyCoupon(new ApplyCouponCommand({ subscriptionId: subscriptionId(), couponCode: code }));

/**
 * Submits a demo payment without collecting card details.
 * @param {string} status - `COMPLETED` or `REJECTED`.
 */
const onPay = (status) => {
  const amount = store.checkoutAmount;
  if (!amount || !store.selectedPlan || store.processing) return;
  store.submitPayment(new SubmitPaymentCommand({
    subscriptionId: subscriptionId(),
    cardToken: 'demo-payment-token',
    amount,
    simulatedStatus: status
  }));
};

/** Leaves checkout and clears its transient state. */
const onReturnToCatalog = () => {
  store.resetCheckout();
  router.push('/subscriptions/plans');
};
</script>

<template>
  <div class="page">
    <pv-progress-bar v-if="store.processing" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>

    <page-header :breadcrumbs="breadcrumbs" :title="t('subscriptions.checkout.title')" :subtitle="t('subscriptions.checkout.subtitle')"/>

    <message-card v-if="store.error" icon="pi pi-times-circle" :message="t(store.error)" alert/>

    <message-card v-if="store.paymentResult"
                  :icon="store.paymentResult === PaymentStatus.COMPLETED ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'"
                  :message="t(store.paymentResult === PaymentStatus.COMPLETED ? 'subscriptions.checkout.payment-approved' : 'subscriptions.checkout.payment-rejected')"
                  :alert="store.paymentResult === PaymentStatus.REJECTED">
      <template v-if="store.paymentResult === PaymentStatus.COMPLETED" #actions>
        <pv-button :label="t('subscriptions.checkout.view-billing')" @click="router.push('/subscriptions/billing')"/>
      </template>
    </message-card>

    <div v-if="store.selectedPlan" class="checkout-grid">
      <pv-card class="sa-card">
        <template #title>
          <span class="flex align-items-center gap-3 text-lg">
            <i class="pi pi-verified text-3xl title-icon" aria-hidden="true"/>{{ t('subscriptions.checkout.summary') }}
          </span>
        </template>
        <template #content>
          <dl>
            <div>
              <dt>{{ t('subscriptions.checkout.plan') }}</dt>
              <dd>{{ t(`subscriptions.plan-code.${store.selectedPlan.code}`) }}</dd>
            </div>
            <div>
              <dt>{{ t('subscriptions.checkout.billing-cycle') }}</dt>
              <dd>{{ t(`subscriptions.billing-cycle.${store.billingCycle}`) }}</dd>
            </div>
            <div>
              <dt>{{ t('subscriptions.checkout.plot-quota') }}</dt>
              <dd>{{ t('subscriptions.plans.plot-quota', { quota: store.selectedPlan.plotQuota }) }}</dd>
            </div>
            <div v-if="store.coupon">
              <dt>{{ t('subscriptions.checkout.coupon') }}</dt>
              <dd>{{ store.coupon.code }} (−{{ store.coupon.discountPercent }}%)</dd>
            </div>
          </dl>
          <p class="total-label">{{ t('subscriptions.checkout.total') }}</p>
          <p class="total">{{ store.checkoutAmount?.format() }}</p>
        </template>
      </pv-card>

      <section class="payment-panel">
        <h2>{{ t('subscriptions.checkout.payment-title') }}</h2>
        <coupon-form :disabled="store.processing" @apply="onApplyCoupon"/>

        <pv-card class="sa-card">
          <template #content>
            <p class="demo-notice">
              <i class="pi pi-info-circle" aria-hidden="true"/>
              {{ t('subscriptions.checkout.demo-notice') }}
            </p>
          </template>
        </pv-card>

        <div class="payment-actions">
          <pv-button outlined :label="t('subscriptions.checkout.back')" :disabled="store.processing" @click="onReturnToCatalog"/>
          <div v-if="store.paymentResult !== PaymentStatus.COMPLETED" class="demo-payment-actions">
            <pv-button outlined :label="t('subscriptions.checkout.simulate-rejection')" :disabled="store.processing || !store.checkoutAmount"
                       @click="onPay(PaymentStatus.REJECTED)"/>
            <pv-button icon="pi pi-lock" :label="t('subscriptions.checkout.simulate-payment')" :disabled="store.processing || !store.checkoutAmount"
                       @click="onPay(PaymentStatus.COMPLETED)"/>
          </div>
        </div>
      </section>
    </div>
    <message-card v-else-if="store.paymentResult !== PaymentStatus.COMPLETED" icon="pi pi-shopping-cart" :message="t('subscriptions.checkout.no-plan')">
      <template #actions>
        <pv-button :label="t('subscriptions.checkout.choose-plan')" @click="onReturnToCatalog"/>
      </template>
    </message-card>
  </div>
</template>

<style scoped>
.checkout-grid {
  display: grid;
  grid-template-columns: minmax(260px, 0.8fr) minmax(320px, 1.2fr);
  align-items: start;
  gap: 24px;
}

.title-icon,
.demo-notice i {
  flex: none;
  color: var(--sa-primary);
}

dl {
  display: grid;
  gap: 16px;
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

.total-label {
  margin: 28px 0 4px;
}

.total {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
}

.payment-panel {
  display: grid;
  gap: 16px;
}

.payment-panel h2 {
  margin: 0;
}

.demo-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 0;
}

.payment-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.demo-payment-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 760px) {
  .checkout-grid {
    grid-template-columns: 1fr;
  }

  .payment-actions,
  .demo-payment-actions {
    flex-direction: column-reverse;
  }
}
</style>
