/**
 * Command to schedule a technical visit by an agronomist for a reported pest issue.
 *
 * @class ScheduleFieldInspectionCommand
 */
export class ScheduleFieldInspectionCommand {
    /**
     * @param {Object} props - Command payload.
     * @param {number} props.reportId - Identifier of the associated pest report.
     * @param {string} props.scheduledAt - ISO datetime scheduled for the visit.
     * @param {string} [props.notes] - Preliminary instructions or observation notes for the inspector.
     */
    constructor({ reportId, scheduledAt, notes }) {
        this.reportId = reportId;
        this.scheduledAt = scheduledAt;
        this.notes = notes;
    }
}
