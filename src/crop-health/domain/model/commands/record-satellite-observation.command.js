/**
 * Command to record or synchronize a satellite imagery observation (NDVI/NDWI) for a plot.
 *
 * @class RecordSatelliteObservationCommand
 */
export class RecordSatelliteObservationCommand {
    /**
     * @param {Object} props - Command payload.
     * @param {number} props.plotId - Identifier of the plot monitored.
     * @param {string} props.date - Date of the satellite pass.
     * @param {number} props.ndviMean - Mean NDVI vegetation index value.
     * @param {number} props.ndwiMean - Mean NDWI water/moisture index value.
     * @param {number} [props.surfaceTempKelvin] - Optional surface temperature in Kelvin.
     * @param {number} [props.cloudCoveragePercent] - Optional percentage of cloud cover over the plot.
     */
    constructor({ plotId, date, ndviMean, ndwiMean, surfaceTempKelvin, cloudCoveragePercent }) {
        this.plotId = plotId;
        this.date = date;
        this.ndviMean = ndviMean;
        this.ndwiMean = ndwiMean;
        this.surfaceTempKelvin = surfaceTempKelvin;
        this.cloudCoveragePercent = cloudCoveragePercent;
    }
}
