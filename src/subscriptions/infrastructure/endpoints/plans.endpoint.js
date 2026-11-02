import {BaseEndpoint} from "../../../shared/infrastructure/base-endpoint.js";
import {PlanAssembler} from "../assemblers/plan.assembler.js";

const plansEndpointPath = import.meta.env.VITE_PLANS_ENDPOINT_PATH;

/**
 * HTTP endpoint for the plan catalog (`/plans`).
 *
 * @class PlansApiEndpoint
 * @extends BaseEndpoint
 */
export class PlansApiEndpoint extends BaseEndpoint {
    /** @param {import('../../../shared/infrastructure/base-api.js').BaseApi} baseApi - Configured API client owner. */
    constructor(baseApi) {
        super(baseApi, plansEndpointPath);
    }

    /** @returns {Promise<import('../../domain/model/entities/plan.entity.js').Plan[]>} Plans of the catalog. */
    getPlans() {
        return this.getAll().then(response => PlanAssembler.toEntitiesFromResponse(response));
    }
}
