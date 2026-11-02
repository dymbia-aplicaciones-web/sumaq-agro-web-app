import {Money} from "../../../shared/domain/model/money.js";
import {resourcesFromResponse} from "../../../shared/infrastructure/base-assembler.js";
import {Plan} from "../../domain/model/entities/plan.entity.js";

/**
 * Maps plan entities to and from API resources.
 *
 * @class PlanAssembler
 */
export class PlanAssembler {
    /**
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - The API response containing plans.
     * @returns {Plan[]} Plan entities.
     */
    static toEntitiesFromResponse(response) {
        return resourcesFromResponse(response, 'plans').map(resource => this.toEntityFromResource(resource));
    }

    /**
     * @param {Object} resource - Plan resource (prices in `currency`).
     * @returns {Plan} Plan entity.
     */
    static toEntityFromResource(resource) {
        return new Plan({
            id: Number(resource.id),
            code: resource.code,
            name: resource.name,
            monthlyPrice: new Money(resource.monthlyPrice, resource.currency),
            annualPrice: new Money(resource.annualPrice, resource.currency),
            plotQuota: resource.plotQuota,
            features: resource.features
        });
    }

    /**
     * @param {Plan} entity - Plan entity.
     * @returns {Object} Plan resource.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id,
            code: entity.code,
            name: entity.name,
            monthlyPrice: entity.monthlyPrice.amount,
            annualPrice: entity.annualPrice.amount,
            currency: entity.monthlyPrice.currency,
            plotQuota: entity.plotQuota,
            features: entity.features
        };
    }
}
