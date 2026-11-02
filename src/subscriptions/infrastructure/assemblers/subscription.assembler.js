import {fromApiDate, resourcesFromResponse, toApiDate} from "../../../shared/infrastructure/base-assembler.js";
import {Subscription} from "../../domain/model/entities/subscription.entity.js";

/**
 * Maps subscription entities to and from API resources.
 * The resource only has the `planId`; the store completes the plan.
 *
 * @class SubscriptionAssembler
 */
export class SubscriptionAssembler {
    /**
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - The API response containing subscriptions.
     * @returns {Subscription[]} Subscription entities.
     */
    static toEntitiesFromResponse(response) {
        return resourcesFromResponse(response, 'subscriptions').map(resource => this.toEntityFromResource(resource));
    }

    /**
     * @param {Object} resource - Subscription resource (dates as `YYYY-MM-DD`).
     * @returns {Subscription} Subscription entity.
     */
    static toEntityFromResource(resource) {
        return new Subscription({
            id: Number(resource.id),
            userId: resource.userId,
            planId: resource.planId,
            status: resource.status,
            billingCycle: resource.billingCycle,
            startDate: fromApiDate(resource.startDate),
            endDate: resource.endDate ? fromApiDate(resource.endDate) : null,
            autoRenew: resource.autoRenew
        });
    }

    /**
     * @param {Subscription} entity - Subscription entity.
     * @returns {Object} Subscription resource.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id,
            userId: entity.userId,
            planId: entity.planId,
            status: entity.status,
            billingCycle: entity.billingCycle,
            startDate: toApiDate(entity.startDate),
            endDate: entity.endDate ? toApiDate(entity.endDate) : null,
            autoRenew: entity.autoRenew
        };
    }
}
