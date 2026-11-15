import {BaseEndpoint} from "../../../shared/infrastructure/base-endpoint.js";
import {CooperativeMemberAssembler} from "../assemblers/cooperative-member.assembler.js";

const cooperativeMembersEndpointPath = import.meta.env.VITE_COOPERATIVE_MEMBERS_ENDPOINT_PATH || '/cooperative-members';

/**
 * HTTP endpoint for the cooperative member directory.
 *
 * @class CooperativeMembersApiEndpoint
 * @extends BaseEndpoint
 */
export class CooperativeMembersApiEndpoint extends BaseEndpoint {
    /** @param {import('../../../shared/infrastructure/base-api.js').BaseApi} baseApi - Configured API client owner. */
    constructor(baseApi) {
        super(baseApi, cooperativeMembersEndpointPath);
    }

    /**
     * @param {number} cooperativeId - Cooperative.
     * @returns {Promise<import('../../domain/model/entities/cooperative-member.entity.js').CooperativeMember[]>} Members.
     */
    async add(cooperativeId, details) {
        const { fullName, ...resource } = details;
        const [firstName, ...lastNames] = (fullName ?? '').trim().split(/\s+/);
        const { data } = await this.http.post(`/cooperatives/${cooperativeId}/members`, {
            ...resource,
            firstName: resource.firstName ?? firstName,
            lastName: resource.lastName ?? lastNames.join(' ')
        });
        return CooperativeMemberAssembler.toEntityFromResource(data);
    }

    async updateDetails(id, details) {
        const { data } = await this.http.patch(`${this.endpointPath}/${encodeURIComponent(id)}`, details);
        return CooperativeMemberAssembler.toEntityFromResource(data);
    }

    getByCooperative(cooperativeId) {
        return this.getAllBy({ cooperativeId }).then(response => CooperativeMemberAssembler.toEntitiesFromResponse(response));
    }

    /**
     * Resolves memberships by their explicit account reference.
     * @param {number} userId - Account identifier supplied by the current session.
     * @returns {Promise<import('../../domain/model/entities/cooperative-member.entity.js').CooperativeMember[]>} Memberships linked to that account; never matched by member ID.
     */
    getByUser(userId) {
        return this.getAllBy({ userId }).then(response => CooperativeMemberAssembler.toEntitiesFromResponse(response));
    }
}
