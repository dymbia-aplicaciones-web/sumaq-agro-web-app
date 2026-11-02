/**
 * State of a subscription. A cancelled plan keeps its access until the end date.
 * @readonly
 * @enum {string}
 */
export const SubscriptionStatus = Object.freeze({
    ACTIVE: 'ACTIVE',
    CANCELLED: 'CANCELLED'
});
