import {BaseEndpoint} from "../../../shared/infrastructure/base-endpoint.js";
import {TechnicalAdvisorAssembler} from "../assemblers/technical-advisor.assembler.js";

const agronomistAssignmentsEndpointPath = import.meta.env.VITE_AGRONOMIST_ASSIGNMENTS_ENDPOINT_PATH;

/**
 * HTTP endpoint for technical advisor assignments.
 *
 * @class TechnicalAdvisorsApiEndpoint
 * @extends BaseEndpoint
 */
export class TechnicalAdvisorsApiEndpoint extends BaseEndpoint {
    /** @param {import('../../../shared/infrastructure/base-api.js').BaseApi} baseApi - Configured API client owner. */
    constructor(baseApi) {
        super(baseApi, agronomistAssignmentsEndpointPath);
    }

    /**
     * @param {number} cooperativeId - Cooperative.
     * @returns {Promise<import('../../domain/model/entities/technical-advisor.entity.js').TechnicalAdvisor[]>} Advisors of the cooperative.
     */
    getByCooperative(cooperativeId) {
        return this.getAllBy({ cooperativeId }).then(response => TechnicalAdvisorAssembler.toEntitiesFromResponse(response));
    }

    /**
     * @param {number} userId - Agronomist account.
     * @returns {Promise<import('../../domain/model/entities/technical-advisor.entity.js').TechnicalAdvisor|null>} Advisor record, or `null`.
     */
    getByUser(userId) {
        return this.getAllBy({ userId }).then(response => TechnicalAdvisorAssembler.toEntitiesFromResponse(response)[0] ?? null);
    }
}
