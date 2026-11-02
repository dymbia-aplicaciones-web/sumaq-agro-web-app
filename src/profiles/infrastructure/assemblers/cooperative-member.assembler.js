import {CooperativeMember} from "../../domain/model/entities/cooperative-member.entity.js";
import {resourcesFromResponse} from "../../../shared/infrastructure/base-assembler.js";

/**
 * Converts cooperative member resources to their dashboard read model.
 *
 * @class CooperativeMemberAssembler
 */
export class CooperativeMemberAssembler {
    /**
     * @param {Object} resource - Member resource.
     * @returns {CooperativeMember} Member read model.
     */
    static toEntityFromResource(resource) {
        return new CooperativeMember({ ...resource, id: Number(resource.id) });
    }

    /**
     * @param {CooperativeMember} entity - Member read model.
     * @returns {Object} Member resource.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id,
            cooperativeId: entity.cooperativeId,
            fullName: entity.fullName,
            active: entity.active,
            userId: entity.userId,
            plots: entity.plots
        };
    }

    /**
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with members.
     * @returns {CooperativeMember[]} Member read models.
     */
    static toEntitiesFromResponse(response) {
        return resourcesFromResponse(response, 'members').map(resource => this.toEntityFromResource(resource));
    }
}
