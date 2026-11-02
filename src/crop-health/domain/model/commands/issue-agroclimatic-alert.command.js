/**
 * Command to publish or record an agroclimatic alert for a farming region.
 *
 * @class IssueAgroclimaticAlertCommand
 */
export class IssueAgroclimaticAlertCommand {
    /**
     * @param {Object} props - Command payload.
     * @param {string} props.title - Alert headline.
     * @param {string} props.description - Detailed warning description.
     * @param {string} [props.severity='LOW'] - Severity degree (LOW, MEDIUM, HIGH, CRITICAL).
     * @param {string} props.region - Target valley or region.
     * @param {string} [props.source='SENAMHI'] - Source meteorological entity.
     */
    constructor({ title, description, severity, region, source }) {
        this.title = title;
        this.description = description;
        this.severity = severity ?? 'LOW';
        this.region = region;
        this.source = source ?? 'SENAMHI';
    }
}
