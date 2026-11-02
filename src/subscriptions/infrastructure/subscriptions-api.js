import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {SubscriptionAssembler} from "./assemblers/subscription.assembler.js";
import {PaymentAssembler} from "./assemblers/payment.assembler.js";
import {PlansApiEndpoint} from "./endpoints/plans.endpoint.js";
import {SubscriptionsApiEndpoint} from "./endpoints/subscriptions.endpoint.js";
import {PaymentsApiEndpoint} from "./endpoints/payments.endpoint.js";
import {DEMO_COUPONS} from "./demo-coupons.js";
import {buildReceiptPdf} from "./receipt-pdf.js";

/**
 * Infrastructure facade for the plan, subscription and payment endpoints.
 * Every operation returns domain entities.
 *
 * @class SubscriptionsApi
 * @extends BaseApi
 */
export class SubscriptionsApi extends BaseApi {
    /** @type {PlansApiEndpoint} */
    #plansEndpoint;
    /** @type {SubscriptionsApiEndpoint} */
    #subscriptionsEndpoint;
    /** @type {PaymentsApiEndpoint} */
    #paymentsEndpoint;

    /** Creates endpoint clients for plans, subscriptions and payments. */
    constructor() {
        super();
        this.#plansEndpoint = new PlansApiEndpoint(this);
        this.#subscriptionsEndpoint = new SubscriptionsApiEndpoint(this);
        this.#paymentsEndpoint = new PaymentsApiEndpoint(this);
    }

    /** @returns {Promise<import('../domain/model/entities/plan.entity.js').Plan[]>} Plans of the catalog. */
    getPlans() {
        return this.#plansEndpoint.getPlans();
    }

    /**
     * Retrieves the subscription of one user.
     * @param {number} userId - Owner of the subscription.
     * @returns {Promise<import('../domain/model/entities/subscription.entity.js').Subscription|null>}
     * The subscription, or `null` if the user has none yet.
     */
    getSubscriptionByUserId(userId) {
        return this.#subscriptionsEndpoint.getByUser(userId);
    }

    /**
     * Creates a subscription.
     * @param {import('../domain/model/entities/subscription.entity.js').Subscription} subscription - The subscription to create.
     * @returns {Promise<import('../domain/model/entities/subscription.entity.js').Subscription>} The created subscription.
     */
    createSubscription(subscription) {
        return this.#subscriptionsEndpoint.create(SubscriptionAssembler.toResourceFromEntity(subscription))
            .then(response => SubscriptionAssembler.toEntityFromResource(response.data));
    }

    /**
     * Saves the changes of a subscription (new plan, cancellation).
     * @param {import('../domain/model/entities/subscription.entity.js').Subscription} subscription - The subscription to update.
     * @returns {Promise<import('../domain/model/entities/subscription.entity.js').Subscription>} The updated subscription.
     */
    updateSubscription(subscription) {
        return this.#subscriptionsEndpoint.update(subscription.id, SubscriptionAssembler.toResourceFromEntity(subscription))
            .then(response => SubscriptionAssembler.toEntityFromResource(response.data));
    }

    /**
     * Retrieves the payments of one subscription.
     * @param {number} subscriptionId - Subscription that was charged.
     * @returns {Promise<import('../domain/model/entities/payment.entity.js').Payment[]>} Payments.
     */
    getPayments(subscriptionId) {
        return this.#paymentsEndpoint.getBySubscription(subscriptionId);
    }

    /**
     * Registers a payment.
     * @param {import('../domain/model/entities/payment.entity.js').Payment} payment - The payment to create.
     * @returns {Promise<import('../domain/model/entities/payment.entity.js').Payment>} The created payment.
     */
    createPayment(payment) {
        return this.#paymentsEndpoint.create(PaymentAssembler.toResourceFromEntity(payment))
            .then(response => PaymentAssembler.toEntityFromResource(response.data));
    }

    /**
     * Checks a promotional code. Temporary: the RESTful API will validate the coupon.
     * @param {string} couponCode - Code typed by the user.
     * @returns {Promise<number|null>} Percentage discounted, or `null` if the code is not valid.
     */
    getCouponDiscount(couponCode) {
        return Promise.resolve(DEMO_COUPONS[couponCode.trim().toUpperCase()] ?? null);
    }

    /**
     * Builds the receipt of a payment. Temporary: the RESTful API will return the real receipt.
     * @param {import('../domain/model/entities/payment.entity.js').Payment} payment - Payment of the receipt.
     * @param {string} planName - Name of the plan paid.
     * @returns {{fileName: string, content: Blob}} Receipt file.
     */
    buildReceipt(payment, planName) {
        return {
            fileName: `receipt-${payment.transactionToken}.pdf`,
            content: buildReceiptPdf([
                'SumaqAgro - Payment receipt',
                `Transaction: ${payment.transactionToken}`,
                `Plan: ${planName}`,
                `Date: ${payment.paidAt.toISOString().slice(0, 10)}`,
                `Amount: ${payment.amount.currency} ${payment.amount.amount.toFixed(2)}`,
                `Status: ${payment.status}`
            ])
        };
    }
}
