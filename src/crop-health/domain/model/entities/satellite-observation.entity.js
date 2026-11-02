import {requireDate, requireId, requireRange} from "../validation.js";

/**
 * Remote sensing observation obtained from AgroMonitoring/Sentinel-2.
 * NDVI measures vegetation health, while NDWI measures water content and moisture stress.
 *
 * @class SatelliteObservation
 */
export class SatelliteObservation {
    /**
     * @param {Object} props - Entity attributes.
     * @param {number} [props.id=0] - Observation identifier.
     * @param {number} props.plotId - Plot associated with the satellite imagery.
     * @param {string} props.date - Acquisition date of the satellite capture.
     * @param {number} props.ndviMean - Mean NDVI (-1 to 1).
     * @param {number} props.ndwiMean - Mean NDWI (-1 to 1).
     * @param {number} [props.surfaceTempKelvin=0] - Surface temperature in Kelvin.
     * @param {number} [props.cloudCoveragePercent=0] - Percentage of cloud interference across the polygon.
     * @param {number} [props.stressAreaHectares=0] - Estimated stressed area in hectares.
     * @param {string} [props.recommendation=''] - Agronomic recommendation derived from the observation.
     */
    constructor({ id, plotId, date, ndviMean, ndwiMean, surfaceTempKelvin, cloudCoveragePercent, stressAreaHectares, recommendation }) {
        requireId(plotId);
        requireDate(date);
        requireRange(ndviMean, -1, 1);
        requireRange(ndwiMean, -1, 1);
        if (cloudCoveragePercent !== undefined) requireRange(cloudCoveragePercent, 0, 100);
        if (surfaceTempKelvin !== undefined) requireRange(surfaceTempKelvin, 0);
        if (stressAreaHectares !== undefined) requireRange(stressAreaHectares, 0);
        this.id = id ?? 0;
        this.plotId = plotId;
        this.date = date;
        this.ndviMean = ndviMean;
        this.ndwiMean = ndwiMean;
        this.surfaceTempKelvin = surfaceTempKelvin ?? 0;
        this.cloudCoveragePercent = cloudCoveragePercent ?? 0;
        this.stressAreaHectares = stressAreaHectares ?? 0;
        this.recommendation = recommendation ?? '';
    }
}
