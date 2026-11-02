import {INVALID_DATA, requireChoice, requireDate, requireId, requireText} from "../validation.js";

/**
 * Farmer evidence about applying a specific prescription or its subsequent evolution.
 *
 * @typedef {Object} TreatmentFollowUpData
 * @property {string} id - Stable client identifier.
 * @property {number} reportId - Pest report of the case.
 * @property {number} prescriptionId - Prescription followed.
 * @property {number} producerUserId - Producer who recorded the evidence.
 * @property {'APPLICATION'|'EVOLUTION'} kind - Kind of evidence.
 * @property {string} occurredOn - Date as `YYYY-MM-DD`.
 * @property {string} notes - Observations of the producer.
 * @property {string} recordedAt - ISO date-time of the record.
 */

/**
 * Validates immutable evidence; recording evolution never declares clinical recovery.
 *
 * @class TreatmentFollowUp
 */
export class TreatmentFollowUp {
    /** @param {TreatmentFollowUpData} data - Evidence from API data or a validated farmer command. */
    constructor(data) {
        requireText(data.id);
        requireId(data.reportId);
        requireId(data.prescriptionId);
        requireId(data.producerUserId);
        requireChoice(data.kind, ['APPLICATION', 'EVOLUTION']);
        requireDate(data.occurredOn);
        requireDate(data.recordedAt);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data.occurredOn)) throw new Error(INVALID_DATA);
        requireText(data.notes, 10);
        if (data.notes.trim().length > 2000) throw new Error(INVALID_DATA);
        /** @type {TreatmentFollowUpData} */
        this.data = { ...data, notes: data.notes.trim() };
    }
}
