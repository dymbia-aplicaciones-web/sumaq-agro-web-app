import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {resourcesFromResponse} from "../../shared/infrastructure/base-assembler.js";
import {TreatmentFollowUp} from "../domain/model/entities/treatment-follow-up.js";

const treatmentFollowUpsEndpointPath = import.meta.env.VITE_TREATMENT_FOLLOW_UPS_ENDPOINT_PATH;

/**
 * HTTP adapter for immutable farmer evidence, independently of the prescription itself.
 *
 * @class TreatmentFollowUpsApi
 * @extends BaseApi
 */
export class TreatmentFollowUpsApi extends BaseApi {
    /**
     * Loads evidence for one report, validating every returned resource.
     * @param {number} reportId - Pest report.
     * @returns {Promise<TreatmentFollowUp[]>} Evidence of the report.
     */
    getByReport(reportId) {
        return this.http.get(treatmentFollowUpsEndpointPath, { params: { reportId } })
            .then(response => resourcesFromResponse(response, 'followUps').map(item => new TreatmentFollowUp(item)));
    }

    /**
     * Sends evidence with a stable client ID, allowing a failed response to be reconciled.
     * @param {import('../domain/model/entities/treatment-follow-up.js').TreatmentFollowUpData} data - Evidence.
     * @returns {Promise<TreatmentFollowUp>} Saved evidence.
     */
    record(data) {
        return this.http.post(treatmentFollowUpsEndpointPath, new TreatmentFollowUp(data).data)
            .then(response => new TreatmentFollowUp(response.data));
    }
}
