import {Cooperative} from "../../domain/model/entities/cooperative.entity.js";
import {resourcesFromResponse} from "../../../shared/infrastructure/base-assembler.js";

/**
 * Converts the Cooperative API contract to the domain entity and back.
 *
 * @class CooperativeAssembler
 */
export class CooperativeAssembler {
    /**
     * @param {Object} resource - Cooperative resource.
     * @returns {Cooperative} Cooperative entity.
     */
    static toEntityFromResource(resource) {
        return new Cooperative({ ...resource, id: Number(resource.id) });
    }

    /**
     * @param {Cooperative} entity - Cooperative entity.
     * @returns {Object} Cooperative resource.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id,
            directorUserId: entity.directorUserId,
            legalName: entity.legalName,
            region: entity.region,
            institutionalEmail: entity.institutionalEmail,
            legalRepresentative: entity.legalRepresentative,
            ruc: entity.ruc,
            headquartersAddress: entity.headquartersAddress,
            switchboardPhone: entity.switchboardPhone
        };
    }

    /**
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with cooperatives.
     * @returns {Cooperative[]} Cooperative entities.
     */
    static toEntitiesFromResponse(response) {
        return resourcesFromResponse(response, 'cooperatives').map(resource => this.toEntityFromResource(resource));
    }
}
