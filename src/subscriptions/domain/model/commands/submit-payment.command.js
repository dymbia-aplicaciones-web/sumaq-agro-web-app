/**
 * Sends the payment of the selected plan.
 * `cardToken` is the token returned by the gateway; the card number never reaches the application.
 * `simulatedStatus` is temporary: with the fake API it decides if the payment is
 * approved or rejected, until Niubiz answers.
 *
 * @class SubmitPaymentCommand
 */
export class SubmitPaymentCommand {
    /**
     * @param {Object} props - Command data.
     * @param {?number} props.subscriptionId - `null` for the first payment, when the user has no subscription yet.
     * @param {string} props.cardToken - Token of the card returned by the gateway.
     * @param {import('../../../../shared/domain/model/money.js').Money} props.amount - Amount to charge.
     * @param {string} [props.simulatedStatus] - `COMPLETED` or `REJECTED` (demo only).
     */
    constructor({ subscriptionId, cardToken, amount, simulatedStatus }) {
        this.subscriptionId = subscriptionId;
        this.cardToken = cardToken;
        this.amount = amount;
        this.simulatedStatus = simulatedStatus;
    }
}
