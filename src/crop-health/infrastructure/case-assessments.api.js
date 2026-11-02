import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {resourcesFromResponse} from "../../shared/infrastructure/base-assembler.js";
import {CaseAssessment} from "../domain/model/entities/case-assessment.js";

const caseAssessmentsEndpointPath = import.meta.env.VITE_CASE_ASSESSMENTS_ENDPOINT_PATH;

/**
 * Persistence contract for immutable case evaluations, separate from prescription issuance.
 *
 * @class CaseAssessmentsApi
 * @extends BaseApi
 */
export class CaseAssessmentsApi extends BaseApi {
    /**
     * Loads validated assessment history for a single incident.
     * @param {number} reportId - Pest report.
     * @returns {Promise<CaseAssessment[]>} Assessments of the report.
     */
    getByReport(reportId) {
        return this.http.get(caseAssessmentsEndpointPath, { params: { reportId } })
            .then(response => resourcesFromResponse(response, 'assessments').map(item => new CaseAssessment(item)));
    }

    /**
     * Persists a stable client ID so interrupted writes can be reconciled before retrying.
     * @param {import('../domain/model/entities/case-assessment.js').CaseAssessmentData} data - Assessment.
     * @returns {Promise<CaseAssessment>} Saved assessment.
     */
    record(data) {
        return this.http.post(caseAssessmentsEndpointPath, new CaseAssessment(data).data)
            .then(response => new CaseAssessment(response.data));
    }
}
