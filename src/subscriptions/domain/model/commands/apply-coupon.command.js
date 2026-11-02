/**
 * Applies a promotional code to the amount to pay.
 *
 * @class ApplyCouponCommand
 */
export class ApplyCouponCommand {
    /**
     * @param {Object} props - Command data.
     * @param {?number} props.subscriptionId - `null` while the user has no subscription yet.
     * @param {string} props.couponCode - Code typed by the user.
     */
    constructor({ subscriptionId, couponCode }) {
        this.subscriptionId = subscriptionId;
        this.couponCode = couponCode;
    }
}
