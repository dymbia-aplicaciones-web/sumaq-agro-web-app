import {PaymentStatus} from "./payment-status.js";

/**
 * One charge of a subscription, confirmed by the payment gateway.
 *
 * @class Payment
 */
export class Payment {
    /**
     * @param {Object} props - Entity attributes.
     * @param {number} props.id - Payment identifier.
     * @param {number} props.subscriptionId - Subscription that was charged.
     * @param {import('../../../../shared/domain/model/money.js').Money} props.amount - Amount charged.
     * @param {string} props.transactionToken - Token returned by the gateway; the card number is never stored.
     * @param {string} props.status - Result of the charge (`PaymentStatus`).
     * @param {Date} props.paidAt - Date and time of the charge.
     */
    constructor({ id, subscriptionId, amount, transactionToken, status, paidAt }) {
        this.id = id;
        this.subscriptionId = subscriptionId;
        this.amount = amount;
        this.transactionToken = transactionToken;
        this.status = status;
        this.paidAt = paidAt;
    }

    /** @returns {boolean} `true` when the gateway approved the charge. */
    isCompleted() {
        return this.status === PaymentStatus.COMPLETED;
    }

    /** @returns {boolean} `true` when the gateway rejected the charge. */
    isRejected() {
        return this.status === PaymentStatus.REJECTED;
    }
}
