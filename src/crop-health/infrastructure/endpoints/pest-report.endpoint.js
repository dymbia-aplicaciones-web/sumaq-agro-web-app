import {BaseEndpoint} from "../../../shared/infrastructure/base-endpoint.js";
import {PestReportAssembler} from "../assemblers/pest-report.assembler.js";

const pestReportsEndpointPath = import.meta.env.VITE_PEST_REPORTS_ENDPOINT_PATH;

/**
 * HTTP endpoint for managing pest reports data (`/pest-reports`).
 *
 * @class PestReportsApiEndpoint
 * @extends BaseEndpoint
 */
export class PestReportsApiEndpoint extends BaseEndpoint {
    /** @param {import('../../../shared/infrastructure/base-api.js').BaseApi} baseApi - Configured API client owner. */
    constructor(baseApi) {
        super(baseApi, pestReportsEndpointPath);
    }

    /**
     * Fetches all pest reports associated with a specific plot.
     * @param {number} plotId - The unique identifier of the plot.
     * @returns {Promise<import('../../domain/model/entities/pest-report.entity.js').PestReport[]>} Reports.
     */
    getByPlot(plotId) {
        return this.getAllBy({ plotId }).then(response => PestReportAssembler.toEntitiesFromResponse(response));
    }
}
