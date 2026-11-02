import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {resourcesFromResponse} from "../../shared/infrastructure/base-assembler.js";

const plotAdvisorAssignmentsEndpointPath = import.meta.env.VITE_PLOT_ADVISOR_ASSIGNMENTS_ENDPOINT_PATH;

/**
 * Current demo authorization for one producer-owned plot. One record per plot
 * stores the current responsible advisor and preserves previous periods.
 * Production must enforce ownership, advisor consent and uniqueness in the API.
 *
 * @typedef {Object} PlotAdvisorAssignment
 * @property {number} id
 * @property {number} plotId
 * @property {number} producerUserId
 * @property {number} advisorUserId
 * @property {'ACTIVE'|'INACTIVE'} status
 * @property {string} assignedAt
 * @property {Array<{advisorUserId: number, assignedAt: string, endedAt: string}>} history
 */

/**
 * HTTP contract for plot responsibility, independent of cooperative subscriptions.
 *
 * @class PlotAdvisorAssignmentsApi
 * @extends BaseApi
 */
export class PlotAdvisorAssignmentsApi extends BaseApi {
    /**
     * Loads responsibility records linked to a producer account.
     * @param {number} userId - Producer.
     * @returns {Promise<PlotAdvisorAssignment[]>} Assignments.
     */
    getByProducer(userId) {
        return this.http.get(plotAdvisorAssignmentsEndpointPath, { params: { producerUserId: userId } })
            .then(response => resourcesFromResponse(response, 'assignments'));
    }

    /**
     * Loads explicitly granted responsibilities; cooperative membership does not grant access.
     * @param {number} userId - Advisor.
     * @returns {Promise<PlotAdvisorAssignment[]>} Assignments.
     */
    getByAdvisor(userId) {
        return this.http.get(plotAdvisorAssignmentsEndpointPath, { params: { advisorUserId: userId } })
            .then(response => resourcesFromResponse(response, 'assignments'));
    }

    /**
     * Reads current responsibility before a write; duplicate records require repair.
     * @param {number} plotId - Plot.
     * @returns {Promise<PlotAdvisorAssignment|null>} Current assignment, or `null`.
     */
    getByPlot(plotId) {
        return this.http.get(plotAdvisorAssignmentsEndpointPath, { params: { plotId } })
            .then(response => {
                const items = resourcesFromResponse(response, 'assignments');
                if (items.length > 1) throw new Error('profiles.advisory.errors.conflict');
                return items[0] ?? null;
            });
    }

    /**
     * Saves a single current assignment; history travels in the same JSON resource.
     * @param {PlotAdvisorAssignment} record - Assignment.
     * @param {boolean} existing - `true` to update an existing record.
     * @returns {Promise<PlotAdvisorAssignment>} Saved assignment.
     */
    save(record, existing) {
        const request = existing
            ? this.http.put(`${plotAdvisorAssignmentsEndpointPath}/${record.id}`, record)
            : this.http.post(plotAdvisorAssignmentsEndpointPath, record);
        return request.then(response => response.data);
    }
}
