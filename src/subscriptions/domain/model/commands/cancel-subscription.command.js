/**
 * Stops the renewal of a paid plan; the access stays until the end date.
 *
 * @class CancelSubscriptionCommand
 */
export class CancelSubscriptionCommand {
    /**
     * @param {Object} props - Command data.
     * @param {number} props.subscriptionId - Subscription to cancel.
     */
    constructor({ subscriptionId }) {
        this.subscriptionId = subscriptionId;
    }
}
