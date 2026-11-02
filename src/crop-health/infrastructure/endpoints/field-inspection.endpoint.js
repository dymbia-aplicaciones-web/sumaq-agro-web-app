import {BaseEndpoint} from "../../../shared/infrastructure/base-endpoint.js";
import {FieldInspectionAssembler} from "../assemblers/field-inspection.assembler.js";

const fieldInspectionsEndpointPath = import.meta.env.VITE_FIELD_INSPECTIONS_ENDPOINT_PATH;

/**
 * HTTP endpoint for managing scheduled field inspections (`/field-inspections`).
 *
 * @class FieldInspectionsApiEndpoint
 * @extends BaseEndpoint
 */
export class FieldInspectionsApiEndpoint extends BaseEndpoint {
    /** @param {import('../../../shared/infrastructure/base-api.js').BaseApi} baseApi - Configured API client owner. */
    constructor(baseApi) {
        super(baseApi, fieldInspectionsEndpointPath);
    }

    /**
     * Fetches field inspections linked to a specific pest report.
     * @param {number} reportId - The unique identifier of the pest report.
     * @returns {Promise<import('../../domain/model/entities/field-inspection.entity.js').FieldInspection[]>} Inspections.
     */
    getByReportId(reportId) {
        return this.getAllBy({ reportId }).then(response => FieldInspectionAssembler.toEntitiesFromResponse(response));
    }
}
