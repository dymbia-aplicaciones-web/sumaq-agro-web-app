/**
 * Result of a charge confirmed by the payment gateway.
 * @readonly
 * @enum {string}
 */
export const PaymentStatus = Object.freeze({
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
    REJECTED: 'REJECTED'
});
