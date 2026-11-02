import {BaseEndpoint} from "../../../shared/infrastructure/base-endpoint.js";
import {resourcesFromResponse} from "../../../shared/infrastructure/base-assembler.js";
import {CooperativeDashboardAssembler} from "../assemblers/cooperative-dashboard.assembler.js";

const cooperativeDashboardsEndpointPath = import.meta.env.VITE_COOPERATIVE_DASHBOARDS_ENDPOINT_PATH;

/**
 * HTTP endpoint for the cooperative director dashboard projection.
 *
 * @class CooperativeDashboardApiEndpoint
 * @extends BaseEndpoint
 */
export class CooperativeDashboardApiEndpoint extends BaseEndpoint {
    /** @param {import('../../../shared/infrastructure/base-api.js').BaseApi} baseApi - Configured API client owner. */
    constructor(baseApi) {
        super(baseApi, cooperativeDashboardsEndpointPath);
    }

    /**
     * @param {number} directorUserId - Director.
     * @returns {Promise<import('../../domain/model/entities/cooperative-dashboard.entity.js').CooperativeDashboard|null>} Dashboard, or `null`.
     */
    getByDirector(directorUserId) {
        return this.getAllBy({ directorUserId }).then(response => {
            const [first] = resourcesFromResponse(response, 'dashboards');
            return first ? CooperativeDashboardAssembler.toEntity(first) : null;
        });
    }
}
