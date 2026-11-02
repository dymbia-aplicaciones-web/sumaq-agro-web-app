import {ClimateForecast} from "../../domain/model/entities/climate-forecast.entity.js";
import {resourcesFromResponse} from "../../../shared/infrastructure/base-assembler.js";

/**
 * Maps climate forecast entities to and from API resources.
 *
 * @class ClimateForecastAssembler
 */
export class ClimateForecastAssembler {
    /**
     * @param {Object} resource - Forecast resource.
     * @returns {ClimateForecast} Forecast entity.
     */
    static toEntityFromResource(resource) {
        return new ClimateForecast({
            id: Number(resource.id),
            region: resource.region,
            temperature: resource.temperature,
            rainChance: resource.rainChance,
            forecastDate: resource.forecastDate,
            source: resource.source
        });
    }

    /**
     * @param {ClimateForecast} entity - Forecast entity.
     * @returns {Object} Forecast resource.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id, region: entity.region, temperature: entity.temperature,
            rainChance: entity.rainChance, forecastDate: entity.forecastDate, source: entity.source
        };
    }

    /**
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with forecasts.
     * @returns {ClimateForecast[]} Forecast entities.
     */
    static toEntitiesFromResponse(response) {
        return resourcesFromResponse(response, 'forecasts').map(resource => this.toEntityFromResource(resource));
    }
}
