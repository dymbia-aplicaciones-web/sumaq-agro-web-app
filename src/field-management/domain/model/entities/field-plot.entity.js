/**
 * Monitoring status of a field plot.
 * @readonly
 * @enum {string}
 */
export const PlotStatus = Object.freeze({
    /** Polygon not drawn yet. */
    WITHOUT_POLYGON: 'WITHOUT_POLYGON',
    /** Polygon linked to AgroMonitoring. */
    ACTIVE_MONITORING: 'ACTIVE_MONITORING'
});

/**
 * Texture of the soil of a plot.
 * @readonly
 * @enum {string}
 */
export const SoilTexture = Object.freeze({
    SANDY: 'SANDY',
    LOAMY: 'LOAMY',
    CLAY: 'CLAY',
    SILTY: 'SILTY',
    SANDY_LOAM: 'SANDY_LOAM',
    CLAY_LOAM: 'CLAY_LOAM'
});

/**
 * A point of the plot polygon.
 *
 * @class GeoCoordinate
 */
export class GeoCoordinate {
    /**
     * @param {number} latitude - Latitude in degrees.
     * @param {number} longitude - Longitude in degrees.
     */
    constructor(latitude, longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }
}

/**
 * First soil analysis of the plot.
 *
 * @class SoilBaseline
 */
export class SoilBaseline {
    /**
     * @param {Object} props - Soil analysis.
     * @param {number} props.ph - pH of the soil.
     * @param {string} props.texture - Texture of the soil (`SoilTexture`).
     * @param {number} props.organicMatterPercentage - Organic matter, from 0 to 100 %.
     * @param {Date} props.recordedAt - Date of the analysis.
     */
    constructor({ ph, texture, organicMatterPercentage, recordedAt }) {
        this.ph = ph;
        this.texture = texture;
        this.organicMatterPercentage = organicMatterPercentage;
        this.recordedAt = recordedAt;
    }
}

/**
 * Plot of a producer, with its GPS polygon and soil analysis.
 *
 * @class FieldPlot
 */
export class FieldPlot {
    /**
     * @param {Object} props - Entity attributes.
     * @param {number} props.id - Plot identifier.
     * @param {number} props.ownerUserId - Producer who owns the plot.
     * @param {string} props.name - Name of the plot.
     * @param {string} props.region - Region or valley.
     * @param {string} [props.status=PlotStatus.WITHOUT_POLYGON] - Monitoring status.
     * @param {GeoCoordinate[]} [props.boundary=[]] - Polygon vertices, in order.
     * @param {number} [props.areaHectares=0] - Area of the plot.
     * @param {?string} [props.agroMonitoringPolygonId=null] - Polygon identifier in AgroMonitoring.
     * @param {?SoilBaseline} [props.soilBaseline=null] - `null` until the soil analysis is recorded.
     */
    constructor({ id, ownerUserId, name, region, status, boundary, areaHectares, agroMonitoringPolygonId, soilBaseline }) {
        this.id = id;
        this.ownerUserId = ownerUserId;
        this.name = name;
        this.region = region;
        this.status = status ?? PlotStatus.WITHOUT_POLYGON;
        this.boundary = boundary ?? [];
        this.areaHectares = areaHectares ?? 0;
        this.agroMonitoringPolygonId = agroMonitoringPolygonId ?? null;
        this.soilBaseline = soilBaseline ?? null;
    }

    /** @returns {boolean} At least 3 points. Crop Health also uses it. */
    hasPolygon() {
        return this.boundary.length >= 3;
    }

    /** @returns {boolean} `true` when the plot is linked to AgroMonitoring. */
    isMonitored() {
        return this.status === PlotStatus.ACTIVE_MONITORING;
    }
}
