import {BaseEndpoint} from "../../../shared/infrastructure/base-endpoint.js";
import {PaymentAssembler} from "../assemblers/payment.assembler.js";

const paymentsEndpointPath = import.meta.env.VITE_PAYMENTS_ENDPOINT_PATH;

/**
 * HTTP endpoint for the payments resource (`/payments`).
 *
 * @class PaymentsApiEndpoint
 * @extends BaseEndpoint
 */
export class PaymentsApiEndpoint extends BaseEndpoint {
    /** @param {import('../../../shared/infrastructure/base-api.js').BaseApi} baseApi - Configured API client owner. */
    constructor(baseApi) {
        super(baseApi, paymentsEndpointPath);
    }

    /**
     * Loads the payments of one subscription.
     * @param {number} subscriptionId - Subscription that was charged.
     * @returns {Promise<import('../../domain/model/entities/payment.entity.js').Payment[]>} Payments.
     */
    getBySubscription(subscriptionId) {
        return this.getAllBy({ subscriptionId }).then(response => PaymentAssembler.toEntitiesFromResponse(response));
    }
}
