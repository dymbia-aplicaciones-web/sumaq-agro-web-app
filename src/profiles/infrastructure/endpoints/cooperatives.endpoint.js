import {BaseEndpoint} from "../../../shared/infrastructure/base-endpoint.js";
import {CooperativeAssembler} from "../assemblers/cooperative.assembler.js";

const cooperativesEndpointPath = import.meta.env.VITE_COOPERATIVES_ENDPOINT_PATH;

/**
 * HTTP endpoint for institutional cooperative data.
 *
 * @class CooperativesApiEndpoint
 * @extends BaseEndpoint
 */
export class CooperativesApiEndpoint extends BaseEndpoint {
    /** @param {import('../../../shared/infrastructure/base-api.js').BaseApi} baseApi - Configured API client owner. */
    constructor(baseApi) {
        super(baseApi, cooperativesEndpointPath);
    }

    /**
     * @param {number} userId - Director.
     * @returns {Promise<import('../../domain/model/entities/cooperative.entity.js').Cooperative|null>} Cooperative, or `null`.
     */
    getByDirector(userId) {
        return this.getAllBy({ directorUserId: userId }).then(response => CooperativeAssembler.toEntitiesFromResponse(response)[0] ?? null);
    }
}
