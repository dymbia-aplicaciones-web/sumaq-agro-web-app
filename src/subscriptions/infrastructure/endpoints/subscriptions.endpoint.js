import {BaseEndpoint} from "../../../shared/infrastructure/base-endpoint.js";
import {SubscriptionAssembler} from "../assemblers/subscription.assembler.js";

const subscriptionsEndpointPath = "/subscriptions/me";

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
        this.http = baseApi.http;
    }

    /**
     * Loads the subscription of one user. Each user has only one.
     * @param {number} userId - Owner of the subscription.
     * @returns {Promise<import('../../domain/model/entities/subscription.entity.js').Subscription|null>}
     * The subscription, or `null` if the user has none yet.
     */
    getByUser(userId) {
        return this.http.get(subscriptionsEndpointPath).then(response => response.status === 204 ? null : SubscriptionAssembler.toEntityFromResource({...response.data, userId}));
    }
}
