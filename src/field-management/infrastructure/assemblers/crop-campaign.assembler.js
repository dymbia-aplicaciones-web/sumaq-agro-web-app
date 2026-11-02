import {CropCampaign} from "../../domain/model/entities/crop-campaign.entity.js";
import {fromApiDate, resourcesFromResponse, toApiDate} from "../../../shared/infrastructure/base-assembler.js";

/**
 * Maps crop campaign entities to and from API resources.
 *
 * @class CropCampaignAssembler
 */
export class CropCampaignAssembler {
    /**
     * Converts a response with campaigns to an array of CropCampaign entities.
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - The API response containing campaigns.
     * @returns {CropCampaign[]} An array of CropCampaign entities.
     */
    static toEntitiesFromResponse(response) {
        return resourcesFromResponse(response, 'campaigns').map(resource => this.toEntityFromResource(resource));
    }

    /**
     * Converts a campaign resource (`sowingDate` as `YYYY-MM-DD`) to a CropCampaign entity.
     * @param {Object} resource - The resource to convert.
     * @returns {CropCampaign} The converted CropCampaign entity.
     */
    static toEntityFromResource(resource) {
        return new CropCampaign({
            id: Number(resource.id),
            plotId: resource.plotId,
            season: resource.season,
            cropType: resource.cropType,
            seedVariety: resource.seedVariety,
            customSeedVariety: resource.seedVarietyCustom ?? false,
            sowingDate: resource.sowingDate ? fromApiDate(resource.sowingDate) : null,
            status: resource.status
        });
    }

    /**
     * Converts a CropCampaign entity to a campaign resource.
     * @param {CropCampaign} entity - The entity to convert.
     * @returns {Object} The converted campaign resource.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id,
            plotId: entity.plotId,
            season: entity.season,
            cropType: entity.cropType,
            seedVariety: entity.seedVariety,
            seedVarietyCustom: entity.customSeedVariety,
            sowingDate: entity.sowingDate ? toApiDate(entity.sowingDate) : null,
            status: entity.status
        };
    }
}
