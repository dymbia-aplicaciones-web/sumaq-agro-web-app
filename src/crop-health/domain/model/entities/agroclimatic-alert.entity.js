import {requireChoice, requireDate, requireText} from "../validation.js";

/**
 * Agroclimatic alert emitted by meteorological services. Alerts can warn
 * producers about frosts, heatwaves, or unexpected heavy rains.
 *
 * @class AgroclimaticAlert
 */
export class AgroclimaticAlert {
    /**
     * @param {Object} props - Entity attributes.
     * @param {number} [props.id=0] - Alert identifier.
     * @param {string} props.title - Headline of the alert.
     * @param {string} props.description - Detailed description and protective guidelines.
     * @param {string} [props.severity='LOW'] - Severity level (LOW, MEDIUM, HIGH, CRITICAL).
     * @param {string} props.region - Affected geographic valley or region.
     * @param {string} [props.issuedAt] - Timestamp when the alert was published.
     * @param {string} [props.source='SENAMHI'] - Authority or data source that generated the alert.
     */
    constructor({ id, title, description, severity, region, issuedAt, source }) {
        requireText(title);
        requireText(description);
        requireText(region);
        requireChoice(severity ?? 'LOW', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
        if (issuedAt !== undefined) requireDate(issuedAt);
        this.id = id ?? 0;
        this.title = title;
        this.description = description;
        this.severity = severity ?? 'LOW';
        this.region = region;
        this.issuedAt = issuedAt ?? new Date().toISOString();
        this.source = source ?? 'SENAMHI';
    }
}
