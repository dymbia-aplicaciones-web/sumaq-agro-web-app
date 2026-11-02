/**
 * Command to record a new pest or phytosanitary disease incidence for a plot.
 *
 * @class RecordPestReportCommand
 */
export class RecordPestReportCommand {
    /**
     * @param {Object} props - Command payload.
     * @param {number} props.plotId - Identifier of the target plot.
     * @param {string} [props.plotName=''] - Name of the plot.
     * @param {number} props.reporterId - User ID of the producer or technician filing the report.
     * @param {string} props.description - Detailed description of observed damage or symptoms.
     * @param {string} [props.severity='MEDIUM'] - Severity level (LOW, MEDIUM, HIGH, SEVERE).
     * @param {string} [props.photo] - Optional URL photo evidence.
     * @param {string} [props.clientSyncId] - Optional client synchronization identifier for offline support.
     */
    constructor({ plotId, plotName, reporterId, description, severity, photo, clientSyncId }) {
        this.plotId = plotId;
        this.plotName = plotName ?? '';
        this.reporterId = reporterId;
        this.description = description;
        this.severity = severity ?? 'MEDIUM';
        this.photo = photo;
        this.clientSyncId = clientSyncId;
    }
}
