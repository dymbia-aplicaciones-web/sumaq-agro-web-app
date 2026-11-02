/**
 * Records the initial soil analysis of a plot.
 *
 * @class RecordSoilBaselineCommand
 */
export class RecordSoilBaselineCommand {
    /**
     * @param {Object} props - Command data.
     * @param {number} props.plotId - Plot of the analysis.
     * @param {number} props.ph - pH of the soil, between 0 and 14.
     * @param {string} props.texture - Texture of the soil (`SoilTexture`).
     * @param {number} props.organicMatterPercentage - Organic matter, from 0 to 100 %.
     * @param {Date} props.recordedAt - Date of the analysis.
     */
    constructor({ plotId, ph, texture, organicMatterPercentage, recordedAt }) {
        this.plotId = plotId;
        this.ph = ph;
        this.texture = texture;
        this.organicMatterPercentage = organicMatterPercentage;
        this.recordedAt = recordedAt;
    }
}
