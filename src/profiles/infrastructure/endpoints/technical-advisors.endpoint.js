import {resourcesFromResponse} from "../../../shared/infrastructure/base-assembler.js";
import {FarmerProfilesApiEndpoint} from "./farmer-profiles.endpoint.js";
import {BaseEndpoint} from "../../../shared/infrastructure/base-endpoint.js";
import {TechnicalAdvisorAssembler} from "../assemblers/technical-advisor.assembler.js";

const agronomistAssignmentsEndpointPath = import.meta.env.VITE_AGRONOMIST_ASSIGNMENTS_ENDPOINT_PATH || '/agronomist-assignments';

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
    async getByCooperative(cooperativeId) {
        const response = await this.getAllBy({ cooperativeId });
        const assignments = resourcesFromResponse(response, 'assignments').filter(item => item.active);
        const counts = new Map();
        for (const item of assignments)
            counts.set(item.agronomistUserId, (counts.get(item.agronomistUserId) ?? 0) + 1);
        const profiles = new FarmerProfilesApiEndpoint({ http: this.http });
        return Promise.all([...counts].map(async ([userId, assignedPlotsCount]) => {
            const profile = await profiles.getByUser(userId);
            return TechnicalAdvisorAssembler.toEntityFromResource({
                id: userId, userId, cooperativeId, assignedPlotsCount,
                name: [profile.firstName, profile.lastName].filter(Boolean).join(' '),
                cipCode: '', phone: profile.phoneNumber ?? ''
            });
        }));
    }

    /**
     * @param {number} userId - Agronomist account.
     * @returns {Promise<import('../../domain/model/entities/technical-advisor.entity.js').TechnicalAdvisor|null>} Advisor record, or `null`.
     */
    getByUser(userId) {
        return this.getAllBy({ userId }).then(response => TechnicalAdvisorAssembler.toEntitiesFromResponse(response)[0] ?? null);
    }
}
