import {INVALID_DATA, requireChoice, requireId, requireText} from "../validation.js";

/**
 * Incidence of pest or phytosanitary disease reported in a plot.
 * Workflow: PENDING → INSPECTED (after the field inspection) → RESOLVED (after the assessment).
 *
 * @class PestReport
 */
export class PestReport {
    /**
     * @param {Object} props - Entity attributes.
     * @param {number} [props.id=0] - Report identifier.
     * @param {number} props.plotId - Plot where the pest was detected.
     * @param {string} [props.plotName=''] - Descriptive name of the plot.
     * @param {number} props.reporterId - Producer or technician who filed the report.
     * @param {string} props.description - Observations of symptoms (at least 10 characters).
     * @param {string} [props.severity='MEDIUM'] - Severity degree (LOW, MEDIUM, HIGH, SEVERE).
     * @param {string} [props.status='PENDING'] - Workflow status (PENDING, INSPECTED, RESOLVED).
     * @param {string} [props.photo=''] - URL of the evidence picture.
     * @param {string} [props.clientSyncId=''] - Client-side UUID used for offline synchronization.
     */
    constructor({ id, plotId, plotName, reporterId, description, severity, status, photo, clientSyncId }) {
        requireId(plotId);
        requireId(reporterId);
        requireText(description, 10);
        requireChoice(severity ?? 'MEDIUM', ['LOW', 'MEDIUM', 'HIGH', 'SEVERE']);
        requireChoice(status ?? 'PENDING', ['PENDING', 'INSPECTED', 'RESOLVED']);
        if (photo && !/^https?:\/\/\S+$/.test(photo)) throw new Error(INVALID_DATA);
        this.id = id ?? 0;
        this.plotId = plotId;
        this.plotName = plotName ?? '';
        this.reporterId = reporterId;
        this.description = description;
        this.severity = severity ?? 'MEDIUM';
        this.status = status ?? 'PENDING';
        this.photo = photo ?? '';
        this.clientSyncId = clientSyncId ?? '';
    }

    /** Marks the report as inspected after the field visit. */
    markInspected() {
        if (this.status !== 'PENDING') throw new Error('crop-health.errors.invalid-transition');
        this.status = 'INSPECTED';
    }

    /** Closes the report after the agronomist assesses the recovery. */
    resolve() {
        if (this.status !== 'INSPECTED') throw new Error('crop-health.errors.invalid-transition');
        this.status = 'RESOLVED';
    }
}
