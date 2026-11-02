import {BaseEndpoint} from "../../../shared/infrastructure/base-endpoint.js";
import {FarmerProfileAssembler} from "../assemblers/farmer-profile.assembler.js";

const profilesEndpointPath = import.meta.env.VITE_PROFILES_ENDPOINT_PATH;

/**
 * HTTP endpoint for the farmer Profiles resource.
 *
 * @class FarmerProfilesApiEndpoint
 * @extends BaseEndpoint
 */
export class FarmerProfilesApiEndpoint extends BaseEndpoint {
    /** @param {import('../../../shared/infrastructure/base-api.js').BaseApi} baseApi - Configured API client owner. */
    constructor(baseApi) {
        super(baseApi, profilesEndpointPath);
    }

    /**
     * Loads the profile associated with a user account.
     * @param {number} userId - Farmer.
     * @returns {Promise<import('../../domain/model/entities/farmer-profile.entity.js').FarmerProfile>} Profile.
     * @throws {Error} When the farmer has no profile.
     */
    getByUser(userId) {
        return this.getAllBy({ userId }).then(response => {
            const [profile] = FarmerProfileAssembler.toEntitiesFromResponse(response);
            if (!profile) throw new Error('Farmer profile not found.');
            return profile;
        });
    }
}
