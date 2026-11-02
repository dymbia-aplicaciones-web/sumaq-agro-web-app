import {BaseEndpoint} from "../../../shared/infrastructure/base-endpoint.js";
import {CampaignLedgerAssembler} from "../assemblers/campaign-ledger.assembler.js";

const campaignLedgersEndpointPath = import.meta.env.VITE_CAMPAIGN_LEDGERS_ENDPOINT_PATH;

/**
 * HTTP endpoint for the cost ledgers resource (`/campaign-ledgers`).
 *
 * @class CampaignLedgersApiEndpoint
 * @extends BaseEndpoint
 */
export class CampaignLedgersApiEndpoint extends BaseEndpoint {
    /** @param {import('../../../shared/infrastructure/base-api.js').BaseApi} baseApi - Configured API client owner. */
    constructor(baseApi) {
        super(baseApi, campaignLedgersEndpointPath);
    }

    /**
     * Loads the cost ledger of one campaign. Each campaign has only one ledger.
     * @param {number} campaignId - Campaign of the ledger.
     * @returns {Promise<import('../../domain/model/entities/campaign-ledger.entity.js').CampaignLedger|null>}
     * The ledger, or `null` if the campaign has none yet.
     */
    getByCampaign(campaignId) {
        return this.getAllBy({ campaignId }).then(response => CampaignLedgerAssembler.toEntitiesFromResponse(response)[0] ?? null);
    }
}
