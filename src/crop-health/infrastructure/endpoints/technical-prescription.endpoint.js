import {BaseEndpoint} from "../../../shared/infrastructure/base-endpoint.js";
import {TechnicalPrescriptionAssembler} from "../assemblers/technical-prescription.assembler.js";

const technicalPrescriptionsEndpointPath = import.meta.env.VITE_TECHNICAL_PRESCRIPTIONS_ENDPOINT_PATH;

/**
 * HTTP endpoint for managing agronomist prescriptions (`/technical-prescriptions`).
 *
 * @class TechnicalPrescriptionsApiEndpoint
 * @extends BaseEndpoint
 */
export class TechnicalPrescriptionsApiEndpoint extends BaseEndpoint {
    /** @param {import('../../../shared/infrastructure/base-api.js').BaseApi} baseApi - Configured API client owner. */
    constructor(baseApi) {
        super(baseApi, technicalPrescriptionsEndpointPath);
    }

    /**
     * Fetches the technical prescriptions issued for a specific pest report.
     * @param {number} reportId - The unique identifier of the pest report.
     * @returns {Promise<import('../../domain/model/entities/technical-prescription.entity.js').TechnicalPrescription[]>} Prescriptions.
     */
    getByReportId(reportId) {
        return this.getAllBy({ reportId }).then(response => TechnicalPrescriptionAssembler.toEntitiesFromResponse(response));
    }
}
