import {BaseEndpoint} from "../../../shared/infrastructure/base-endpoint.js";
import {CropCampaignAssembler} from "../assemblers/crop-campaign.assembler.js";

const cropCampaignsEndpointPath = import.meta.env.VITE_CROP_CAMPAIGNS_ENDPOINT_PATH;

/**
 * HTTP endpoint for the crop campaigns resource (`/crop-campaigns`).
 *
 * @class CropCampaignsApiEndpoint
 * @extends BaseEndpoint
 */
export class CropCampaignsApiEndpoint extends BaseEndpoint {
    /** @param {import('../../../shared/infrastructure/base-api.js').BaseApi} baseApi - Configured API client owner. */
    constructor(baseApi) {
        super(baseApi, cropCampaignsEndpointPath);
    }

    /**
     * Loads the campaigns of one plot.
     * @param {number} plotId - Plot where the campaigns take place.
     * @returns {Promise<import('../../domain/model/entities/crop-campaign.entity.js').CropCampaign[]>} Campaigns of the plot.
     */
    getByPlot(plotId) {
        return this.getAllBy({ plotId }).then(response => CropCampaignAssembler.toEntitiesFromResponse(response));
    }

    /**
     * Downloads the cost report of a campaign (`/crop-campaigns/{id}/cost-report`).
     * @param {number} campaignId - Campaign of the report.
     * @returns {Promise<Blob>} Report file.
     */
    getCostReport(campaignId) {
        return this.http.get(`${this.endpointPath}/${campaignId}/cost-report`, { responseType: 'blob' })
            .then(response => response.data);
    }
}
