import {SatelliteObservation} from "../../domain/model/entities/satellite-observation.entity.js";
import {resourcesFromResponse} from "../../../shared/infrastructure/base-assembler.js";

/**
 * Maps satellite observation entities to and from API resources.
 *
 * @class SatelliteObservationAssembler
 */
export class SatelliteObservationAssembler {
    /**
     * @param {Object} resource - Observation resource.
     * @returns {SatelliteObservation} Observation entity.
     */
    static toEntityFromResource(resource) {
        return new SatelliteObservation({
            id: Number(resource.id),
            plotId: resource.plotId,
            date: resource.date,
            ndviMean: resource.ndviMean,
            ndwiMean: resource.ndwiMean,
            surfaceTempKelvin: resource.surfaceTempKelvin,
            cloudCoveragePercent: resource.cloudCoveragePercent,
            stressAreaHectares: resource.stressAreaHectares,
            recommendation: resource.recommendation
        });
    }

    /**
     * @param {SatelliteObservation} entity - Observation entity.
     * @returns {Object} Observation resource.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id,
            plotId: entity.plotId,
            date: entity.date,
            ndviMean: entity.ndviMean,
            ndwiMean: entity.ndwiMean,
            surfaceTempKelvin: entity.surfaceTempKelvin,
            cloudCoveragePercent: entity.cloudCoveragePercent,
            stressAreaHectares: entity.stressAreaHectares,
            recommendation: entity.recommendation
        };
    }

    /**
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with observations.
     * @returns {SatelliteObservation[]} Observation entities.
     */
    static toEntitiesFromResponse(response) {
        return resourcesFromResponse(response, 'observations').map(resource => this.toEntityFromResource(resource));
    }
}
