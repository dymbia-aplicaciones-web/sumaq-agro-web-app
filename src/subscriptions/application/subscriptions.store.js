/**
 * Application service store for the Subscriptions and Payments bounded context
 * (Angular `SubscriptionsStore`).
 *
 * @module useSubscriptionsStore
 */
import {defineStore} from "pinia";
import {computed, ref} from "vue";
import useIamStore from "../../iam/application/iam.store.js";
import {Money} from "../../shared/domain/model/money.js";
import {FileDownloader} from "../../shared/infrastructure/file-downloader.js";
import {BillingCycle} from "../domain/model/entities/billing-cycle.js";
import {Payment} from "../domain/model/entities/payment.entity.js";
import {PaymentStatus} from "../domain/model/entities/payment-status.js";
import {Subscription} from "../domain/model/entities/subscription.entity.js";
import {SubscriptionsApi} from "../infrastructure/subscriptions-api.js";

const subscriptionsApi = new SubscriptionsApi();
const fileDownloader = new FileDownloader();

/**
 * Holds the Subscriptions and Payments state and coordinates its behavior.
 *
 * The views send commands and read the state. Every change is applied to a
 * copy of the subscription; the shown state is only updated when the API
 * confirms. Other contexts (Field Management, IAM) read this store, never its
 * API. Policy P2 belongs to the backend; it is simulated here until the
 * RESTful API exists.
 *
 * @returns {Object} Store state and actions.
 */
const useSubscriptionsStore = defineStore('subscriptions', () => {
    const iamStore = useIamStore();

    // Store state
    /** @type {import('vue').Ref<import('../domain/model/entities/plan.entity.js').Plan[]>} Plans of the catalog. */
    const plans = ref([]);
    /** @type {import('vue').Ref<Subscription|null>} Subscription of the signed-in user, with its plan completed, or `null` if never paid. */
    const subscription = ref(null);
    /** @type {import('vue').Ref<Payment[]>} Payments of the subscription, newest first. */
    const payments = ref([]);
    /** @type {import('vue').Ref<string>} Billing cycle chosen in the catalog. */
    const billingCycle = ref(BillingCycle.MONTHLY);
    /** @type {import('vue').Ref<import('../domain/model/entities/plan.entity.js').Plan|null>} Plan chosen to pay, or `null`. */
    const selectedPlan = ref(null);
    /** @type {import('vue').Ref<{code: string, discountPercent: number}|null>} Coupon applied to the current checkout, or `null`. */
    const coupon = ref(null);
    /** @type {import('vue').Ref<string|null>} Result of the last payment attempt (`COMPLETED` or `REJECTED`), or `null`. */
    const paymentResult = ref(null);
    /** @type {import('vue').Ref<boolean>} `true` once the subscription was loaded, so a quota of 0 is not shown by mistake. */
    const plotQuotaReady = ref(false);

    // UI state
    /** @type {import('vue').Ref<boolean>} `true` while data is being loaded. */
    const loading = ref(false);
    /** @type {import('vue').Ref<boolean>} `true` while a payment or a cancellation is being processed. */
    const processing = ref(false);
    /** @type {import('vue').Ref<string|null>} i18n key of the last error, or `null`. */
    const error = ref(null);

    /** Signed-in user who owns the subscription. */
    const currentUserId = computed(() => iamStore.currentUserId);

    /** `true` when the user has a paid plan with access (active, or cancelled but not yet expired). */
    const hasActivePlan = computed(() => subscription.value?.hasAccess() ?? false);

    /** Plan the user can use now, or `null` when the user has not paid or the plan expired. */
    const currentPlan = computed(() => subscription.value?.hasAccess() ? subscription.value.plan : null);

    /** Plots the user can register. It is 0 without a plan. Field Management reads this value. */
    const plotQuota = computed(() => currentPlan.value?.plotQuota ?? 0);

    /** Amount of the selected plan for the chosen cycle, with the coupon discount. */
    const checkoutAmount = computed(() => {
        const plan = selectedPlan.value;
        if (!plan) return null;
        const price = plan.priceFor(billingCycle.value);
        const discount = coupon.value?.discountPercent ?? 0;
        const discounted = Math.round(price.amount * (1 - discount / 100) * 100) / 100;
        return new Money(discounted, price.currency);
    });

    // Actions

    /** Loads the plans of the catalog. */
    function loadPlans() {
        startLoading();
        subscriptionsApi.getPlans()
            .then(loaded => {
                plans.value = loaded;
                loading.value = false;
            })
            .catch(cause => fail(cause, 'subscriptions.errors.load-plans'));
    }

    /**
     * Loads the subscription of a user and its payments.
     * A user who never paid has no subscription: `subscription` stays `null`.
     * @param {number} userId - Owner of the subscription.
     */
    function loadMySubscription(userId) {
        startLoading();
        Promise.all([subscriptionsApi.getPlans(), subscriptionsApi.getSubscriptionByUserId(userId)])
            .then(([loadedPlans, found]) => {
                const ready = found ? withPlan(found, loadedPlans) : null;
                return (ready ? subscriptionsApi.getPayments(ready.id) : Promise.resolve([]))
                    .then(loadedPayments => ({ loadedPlans, ready, loadedPayments }));
            })
            .then(({ loadedPlans, ready, loadedPayments }) => {
                plans.value = loadedPlans;
                subscription.value = ready;
                payments.value = newestFirst(loadedPayments);
                plotQuotaReady.value = true;
                loading.value = false;
            })
            .catch(cause => fail(cause, 'subscriptions.errors.load-subscription'));
    }

    /**
     * Chooses a plan and a cycle to go to the payment.
     * @param {import('../domain/model/commands/select-subscription-plan.command.js').SelectSubscriptionPlanCommand} command - Plan and billing cycle chosen by the user.
     */
    function selectPlan(command) {
        const plan = plans.value.find(candidate => candidate.code === command.planCode);
        if (!plan || command.userId !== currentUserId.value) {
            error.value = 'subscriptions.errors.select-plan';
            return;
        }
        error.value = null;
        paymentResult.value = null;
        coupon.value = null;
        billingCycle.value = command.billingCycle;
        selectedPlan.value = plan;
    }

    /** Switches the catalog between monthly and annual prices. */
    function toggleBillingCycle() {
        billingCycle.value = billingCycle.value === BillingCycle.MONTHLY ? BillingCycle.ANNUAL : BillingCycle.MONTHLY;
    }

    /**
     * Applies a promotional code to the amount to pay.
     * @param {import('../domain/model/commands/apply-coupon.command.js').ApplyCouponCommand} command - Code typed by the user.
     */
    function applyCoupon(command) {
        if (!selectedPlan.value) return;
        error.value = null;
        subscriptionsApi.getCouponDiscount(command.couponCode)
            .then(discountPercent => {
                if (discountPercent === null) {
                    coupon.value = null;
                    error.value = 'subscriptions.errors.invalid-coupon';
                    return;
                }
                coupon.value = { code: command.couponCode.trim().toUpperCase(), discountPercent };
            })
            .catch(cause => fail(cause, 'subscriptions.errors.invalid-coupon'));
    }

    /**
     * Sends the payment of the selected plan.
     * The first approved payment creates the subscription; later ones change the
     * plan of the existing one. A rejected payment never changes the plan, and
     * it is only saved in the history when the user already has a subscription.
     * The card number never arrives here, only its token.
     * Temporary, until the backend exists: it simulates P2 (an approved payment
     * activates the plan) because Niubiz confirms it on the server.
     * @param {import('../domain/model/commands/submit-payment.command.js').SubmitPaymentCommand} command - Subscription (or `null` for the first payment), card token and amount.
     */
    function submitPayment(command) {
        const plan = selectedPlan.value;
        const userId = currentUserId.value;
        const current = subscription.value;
        if (!plan || userId === null || processing.value) return;
        if (command.subscriptionId !== (current?.id ?? null)) return;

        const status = command.simulatedStatus ?? PaymentStatus.COMPLETED;
        processing.value = true;
        error.value = null;

        chargeAndActivate(userId, plan, current, command, status)
            .then(({ subscription: saved, payment }) => {
                if (saved) {
                    saved.plan = plan;
                    subscription.value = saved;
                    selectedPlan.value = null;
                    coupon.value = null;
                }
                if (payment) payments.value = [payment, ...payments.value];
                paymentResult.value = status;
                processing.value = false;
            })
            .catch(cause => {
                processing.value = false;
                fail(cause, 'subscriptions.errors.payment');
            });
    }

    /**
     * Stops the renewal; the access stays until the end date.
     * @param {import('../domain/model/commands/cancel-subscription.command.js').CancelSubscriptionCommand} command - Subscription to cancel.
     */
    function cancelSubscription(command) {
        const current = subscription.value;
        if (!current || current.id !== command.subscriptionId || processing.value) return;
        const cancelled = current.copy();
        try {
            cancelled.cancel();
        } catch (cause) {
            fail(cause, 'subscriptions.errors.cancel');
            return;
        }
        processing.value = true;
        error.value = null;
        subscriptionsApi.updateSubscription(cancelled)
            .then(saved => {
                saved.plan = current.plan;
                subscription.value = saved;
                processing.value = false;
            })
            .catch(cause => {
                processing.value = false;
                fail(cause, 'subscriptions.errors.cancel');
            });
    }

    /**
     * Downloads the receipt of a payment.
     * @param {number} paymentId - Payment of the receipt.
     */
    function downloadReceipt(paymentId) {
        const payment = payments.value.find(candidate => candidate.id === paymentId);
        if (!payment) {
            error.value = 'subscriptions.errors.receipt';
            return;
        }
        const planName = subscription.value?.plan?.name ?? '';
        fileDownloader.save(subscriptionsApi.buildReceipt(payment, planName));
    }

    /** Clears the checkout (selected plan, coupon and result) when the user leaves it. */
    function resetCheckout() {
        selectedPlan.value = null;
        coupon.value = null;
        paymentResult.value = null;
        error.value = null;
    }

    // Private helpers

    /**
     * Activates the plan when the payment is approved and saves the payment.
     * The subscription is saved first because the payment needs its id.
     */
    function chargeAndActivate(userId, plan, current, command, status) {
        if (status === PaymentStatus.REJECTED) {
            if (!current) return Promise.resolve({ subscription: null, payment: null });
            return subscriptionsApi.createPayment(newPayment(current.id, command.amount, status))
                .then(payment => ({ subscription: null, payment }));
        }

        const today = new Date();
        const cycle = billingCycle.value;
        let saving;
        if (current) {
            const renewed = current.copy();
            renewed.changePlan(plan, cycle, today);
            saving = subscriptionsApi.updateSubscription(renewed);
        } else {
            const created = Subscription.start({ userId, plan, billingCycle: cycle, startDate: today });
            saving = subscriptionsApi.createSubscription(created);
        }
        return saving.then(saved => subscriptionsApi.createPayment(newPayment(saved.id, command.amount, status))
            .then(payment => ({ subscription: saved, payment })));
    }

    function newPayment(subscriptionId, amount, status) {
        return new Payment({
            id: 0,
            subscriptionId,
            amount,
            transactionToken: `demo-tx-${Date.now()}`,
            status,
            paidAt: new Date()
        });
    }

    /** Completes the plan of a subscription from the catalog. */
    function withPlan(found, loadedPlans) {
        found.plan = loadedPlans.find(plan => plan.id === found.planId) ?? null;
        return found;
    }

    function newestFirst(list) {
        return [...list].sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime());
    }

    function startLoading() {
        loading.value = true;
        error.value = null;
    }

    /**
     * Normalizes an error into an i18n key to show it in the view.
     * @param {unknown} cause - Source error.
     * @param {string} fallbackKey - i18n key of the failed operation.
     */
    function fail(cause, fallbackKey) {
        console.error(cause);
        const isKey = cause instanceof Error && cause.message.startsWith('subscriptions.');
        error.value = isKey ? cause.message : fallbackKey;
        loading.value = false;
    }

    return {
        plans,
        subscription,
        payments,
        billingCycle,
        selectedPlan,
        coupon,
        paymentResult,
        loading,
        processing,
        error,
        currentUserId,
        hasActivePlan,
        currentPlan,
        plotQuota,
        plotQuotaReady,
        checkoutAmount,
        loadPlans,
        loadMySubscription,
        selectPlan,
        toggleBillingCycle,
        applyCoupon,
        submitPayment,
        cancelSubscription,
        downloadReceipt,
        resetCheckout
    };
});

export default useSubscriptionsStore;
