import {INVALID_DATA, requireChoice, requireDate, requireId, requireText} from "../validation.js";

/**
 * Immutable professional conclusion, including the exact evidence reviewed.
 *
 * @typedef {Object} CaseAssessmentData
 * @property {string} id - Stable client identifier.
 * @property {number} reportId - Pest report evaluated.
 * @property {number} agronomistUserId - Agronomist who evaluated.
 * @property {'FOLLOW_UP_REQUIRED'|'RECOVERED'} outcome - Conclusion.
 * @property {string} notes - Professional notes.
 * @property {string[]} evidenceIds - Farmer evidence reviewed.
 * @property {string} recordedAt - ISO date-time of the evaluation.
 */

/**
 * Validates a professional assessment; the application validates its case relationships.
 *
 * @class CaseAssessment
 */
export class CaseAssessment {
    /** @param {CaseAssessmentData} data - Snapshot of the professional conclusion and reviewed evidence. */
    constructor(data) {
        requireText(data.id);
        requireId(data.reportId);
        requireId(data.agronomistUserId);
        requireChoice(data.outcome, ['FOLLOW_UP_REQUIRED', 'RECOVERED']);
        requireText(data.notes, 10);
        requireDate(data.recordedAt);
        if (data.notes.trim().length > 2000 || !Array.isArray(data.evidenceIds) || !data.evidenceIds.length)
            throw new Error(INVALID_DATA);
        data.evidenceIds.forEach(id => requireText(id));
        if (new Set(data.evidenceIds).size !== data.evidenceIds.length) throw new Error(INVALID_DATA);
        /** @type {Readonly<CaseAssessmentData>} */
        this.data = Object.freeze({ ...data, notes: data.notes.trim(), evidenceIds: Object.freeze([...data.evidenceIds]) });
    }
}
