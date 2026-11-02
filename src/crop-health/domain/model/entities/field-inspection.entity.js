import {INVALID_DATA, requireChoice, requireDate, requireId, requireText} from "../validation.js";

/**
 * Agronomist technical on-site visit to inspect a reported issue.
 *
 * @class FieldInspection
 */
export class FieldInspection {
    /**
     * @param {Object} props - Entity attributes.
     * @param {number} [props.id=0] - Inspection identifier.
     * @param {number} props.reportId - Related pest report identifier.
     * @param {string} props.scheduledAt - Scheduled date and time for the technical visit.
     * @param {string} [props.notes=''] - Technical diagnosis notes or agronomist recommendations.
     * @param {'SCHEDULED'|'COMPLETED'} [props.status='SCHEDULED'] - Status of the visit.
     * @param {?string} [props.completedAt=null] - When the visit was completed.
     * @param {?number} [props.inspectorUserId=null] - Agronomist who completed the visit.
     */
    constructor({ id, reportId, scheduledAt, notes, status, completedAt, inspectorUserId }) {
        requireId(reportId);
        requireDate(scheduledAt);
        requireChoice(status ?? 'SCHEDULED', ['SCHEDULED', 'COMPLETED']);
        if (status === 'COMPLETED') {
            requireDate(completedAt ?? '');
            requireId(inspectorUserId ?? 0);
            requireText(notes ?? '', 10);
            if (Date.parse(completedAt) < Date.parse(scheduledAt)) throw new Error(INVALID_DATA);
        }
        this.id = id ?? 0;
        this.reportId = reportId;
        this.scheduledAt = scheduledAt;
        this.notes = notes ?? '';
        this.status = status ?? 'SCHEDULED';
        this.completedAt = completedAt ?? null;
        this.inspectorUserId = inspectorUserId ?? null;
    }

    /**
     * Records the findings of the visit.
     * @param {string} notes - Findings (at least 10 characters).
     * @param {number} inspectorUserId - Agronomist who completed the visit.
     * @param {string} [completedAt] - When the visit was completed.
     * @throws {Error} When the visit is already completed or not due yet.
     */
    complete(notes, inspectorUserId, completedAt = new Date().toISOString()) {
        if (this.status !== 'SCHEDULED') throw new Error('crop-health.errors.invalid-transition');
        requireText(notes, 10);
        requireId(inspectorUserId);
        requireDate(completedAt);
        if (Date.parse(completedAt) < Date.parse(this.scheduledAt)) throw new Error('crop-health.errors.visit-not-due');
        this.notes = notes.trim();
        this.inspectorUserId = inspectorUserId;
        this.completedAt = completedAt;
        this.status = 'COMPLETED';
    }
}
