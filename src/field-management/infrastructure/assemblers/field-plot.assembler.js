import {FieldPlot, GeoCoordinate, SoilBaseline} from "../../domain/model/entities/field-plot.entity.js";
import {fromApiDate, resourcesFromResponse, toApiDate} from "../../../shared/infrastructure/base-assembler.js";

/**
 * Maps field plot entities to and from API resources.
 *
 * @class FieldPlotAssembler
 */
export class FieldPlotAssembler {
    /**
     * Converts a response with plots to an array of FieldPlot entities.
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - The API response containing plots.
     * @returns {FieldPlot[]} An array of FieldPlot entities.
     */
    static toEntitiesFromResponse(response) {
        return resourcesFromResponse(response, 'plots').map(resource => this.toEntityFromResource(resource));
    }

    /**
     * Converts a plot resource (`boundary` as `[latitude, longitude]` pairs) to a FieldPlot entity.
     * @param {Object} resource - The resource to convert.
     * @returns {FieldPlot} The converted FieldPlot entity.
     */
    static toEntityFromResource(resource) {
        return new FieldPlot({
            id: Number(resource.id),
            ownerUserId: resource.ownerUserId,
            name: resource.name,
            region: resource.region,
            status: resource.status,
            boundary: (resource.boundary ?? []).map(([latitude, longitude]) => new GeoCoordinate(latitude, longitude)),
            areaHectares: resource.areaHectares,
            agroMonitoringPolygonId: resource.agroMonitoringPolygonId || null,
            soilBaseline: resource.soilBaseline ? this.#toSoilBaseline(resource.soilBaseline) : null
        });
    }

    /**
     * Converts a FieldPlot entity to a plot resource.
     * @param {FieldPlot} entity - The entity to convert.
     * @returns {Object} The converted plot resource.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id,
            ownerUserId: entity.ownerUserId,
            name: entity.name,
            region: entity.region,
            status: entity.status,
            boundary: entity.boundary.map(vertex => [vertex.latitude, vertex.longitude]),
            areaHectares: entity.areaHectares,
            agroMonitoringPolygonId: entity.agroMonitoringPolygonId ?? '',
            soilBaseline: entity.soilBaseline ? this.#toSoilBaselineResource(entity.soilBaseline) : null
        };
    }

    /**
     * Converts the soil analysis as the API sends it (`recordedAt` as `YYYY-MM-DD`).
     * @param {Object} resource - Soil analysis resource.
     * @returns {SoilBaseline} Soil analysis.
     */
    static #toSoilBaseline(resource) {
        return new SoilBaseline({
            ph: resource.ph,
            texture: resource.texture,
            organicMatterPercentage: resource.organicMatterPercentage,
            recordedAt: fromApiDate(resource.recordedAt)
        });
    }

    /**
     * Converts a soil analysis to its resource.
     * @param {SoilBaseline} soilBaseline - The soil analysis to convert.
     * @returns {Object} Soil analysis resource.
     */
    static #toSoilBaselineResource(soilBaseline) {
        return {
            ph: soilBaseline.ph,
            texture: soilBaseline.texture,
            organicMatterPercentage: soilBaseline.organicMatterPercentage,
            recordedAt: toApiDate(soilBaseline.recordedAt)
        };
    }
}
