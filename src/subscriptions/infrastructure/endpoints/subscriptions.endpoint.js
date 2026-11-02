import {BaseEndpoint} from "../../../shared/infrastructure/base-endpoint.js";
import {SubscriptionAssembler} from "../assemblers/subscription.assembler.js";

const subscriptionsEndpointPath = import.meta.env.VITE_SUBSCRIPTIONS_ENDPOINT_PATH;

/**
 * HTTP endpoint for the subscriptions resource (`/subscriptions`).
 *
 * @class SubscriptionsApiEndpoint
 * @extends BaseEndpoint
 */
export class SubscriptionsApiEndpoint extends BaseEndpoint {
    /** @param {import('../../../shared/infrastructure/base-api.js').BaseApi} baseApi - Configured API client owner. */
    constructor(baseApi) {
        super(baseApi, subscriptionsEndpointPath);
    }

    /**
     * Loads the subscription of one user. Each user has only one.
     * @param {number} userId - Owner of the subscription.
     * @returns {Promise<import('../../domain/model/entities/subscription.entity.js').Subscription|null>}
     * The subscription, or `null` if the user has none yet.
     */
    getByUser(userId) {
        return this.getAllBy({ userId }).then(response => SubscriptionAssembler.toEntitiesFromResponse(response)[0] ?? null);
    }
}
