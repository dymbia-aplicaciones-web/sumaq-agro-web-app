import {FarmerProfile} from "../../domain/model/entities/farmer-profile.entity.js";
import {resourcesFromResponse} from "../../../shared/infrastructure/base-assembler.js";

/**
 * Maps the Profiles API contract to the farmer profile domain entity.
 *
 * @class FarmerProfileAssembler
 */
export class FarmerProfileAssembler {
    /**
     * @param {Object} resource - Profile resource.
     * @returns {FarmerProfile} Profile entity.
     */
    static toEntityFromResource(resource) {
        return new FarmerProfile({ ...resource, id: Number(resource.id) });
    }

    /**
     * @param {FarmerProfile} entity - Profile entity.
     * @returns {Object} Profile resource.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id,
            userId: entity.userId,
            firstName: entity.firstName,
            lastName: entity.lastName,
            phoneNumber: entity.phoneNumber,
            email: entity.email
        };
    }

    /**
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with profiles.
     * @returns {FarmerProfile[]} Profile entities.
     */
    static toEntitiesFromResponse(response) {
        return resourcesFromResponse(response, 'profiles').map(resource => this.toEntityFromResource(resource));
    }
}
