import {TechnicalAdvisor} from "../../domain/model/entities/technical-advisor.entity.js";
import {resourcesFromResponse} from "../../../shared/infrastructure/base-assembler.js";

/**
 * Maps technical advisor entities to and from API resources.
 *
 * @class TechnicalAdvisorAssembler
 */
export class TechnicalAdvisorAssembler {
    /**
     * @param {Object} resource - Advisor resource.
     * @returns {TechnicalAdvisor} Advisor entity.
     */
    static toEntityFromResource(resource) {
        return new TechnicalAdvisor({
            id: Number(resource.id),
            cooperativeId: resource.cooperativeId,
            userId: resource.userId,
            name: resource.name,
            cipCode: resource.cipCode,
            phone: resource.phone,
            assignedPlotsCount: resource.assignedPlotsCount ?? 0
        });
    }

    /**
     * @param {TechnicalAdvisor} entity - Advisor entity.
     * @returns {Object} Advisor resource.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id,
            cooperativeId: entity.cooperativeId,
            userId: entity.userId,
            name: entity.name,
            cipCode: entity.cipCode,
            phone: entity.phone,
            assignedPlotsCount: entity.assignedPlotsCount
        };
    }

    /**
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with advisors.
     * @returns {TechnicalAdvisor[]} Advisor entities.
     */
    static toEntitiesFromResponse(response) {
        return resourcesFromResponse(response, 'agronomists').map(resource => this.toEntityFromResource(resource));
    }
}
