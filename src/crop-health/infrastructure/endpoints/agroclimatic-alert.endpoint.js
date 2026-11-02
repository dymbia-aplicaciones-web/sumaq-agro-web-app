import {BaseEndpoint} from "../../../shared/infrastructure/base-endpoint.js";
import {AgroclimaticAlertAssembler} from "../assemblers/agroclimatic-alert.assembler.js";

const agroclimaticAlertsEndpointPath = import.meta.env.VITE_AGROCLIMATIC_ALERTS_ENDPOINT_PATH;

/**
 * HTTP endpoint for managing agroclimatic alerts (`/agroclimatic-alerts`).
 *
 * @class AgroclimaticAlertsApiEndpoint
 * @extends BaseEndpoint
 */
export class AgroclimaticAlertsApiEndpoint extends BaseEndpoint {
    /** @param {import('../../../shared/infrastructure/base-api.js').BaseApi} baseApi - Configured API client owner. */
    constructor(baseApi) {
        super(baseApi, agroclimaticAlertsEndpointPath);
    }

    /**
     * Fetches active agroclimatic alerts for a specific geographic region.
     * @param {string} region - The name of the valley or region.
     * @returns {Promise<import('../../domain/model/entities/agroclimatic-alert.entity.js').AgroclimaticAlert[]>} Alerts.
     */
    getByRegion(region) {
        return this.getAllBy({ region }).then(response => AgroclimaticAlertAssembler.toEntitiesFromResponse(response));
    }
}
