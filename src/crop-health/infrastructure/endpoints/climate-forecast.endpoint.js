import {BaseEndpoint} from "../../../shared/infrastructure/base-endpoint.js";
import {ClimateForecastAssembler} from "../assemblers/climate-forecast.assembler.js";

const climateForecastsEndpointPath = import.meta.env.VITE_CLIMATE_FORECASTS_ENDPOINT_PATH;

/**
 * HTTP endpoint for managing weather and climate forecasts (`/climate-forecasts`).
 *
 * @class ClimateForecastsApiEndpoint
 * @extends BaseEndpoint
 */
export class ClimateForecastsApiEndpoint extends BaseEndpoint {
    /** @param {import('../../../shared/infrastructure/base-api.js').BaseApi} baseApi - Configured API client owner. */
    constructor(baseApi) {
        super(baseApi, climateForecastsEndpointPath);
    }

    /**
     * Fetches the upcoming climate forecasts for a specific geographic region.
     * @param {string} region - The name of the valley or region.
     * @returns {Promise<import('../../domain/model/entities/climate-forecast.entity.js').ClimateForecast[]>} Forecasts.
     */
    getByRegion(region) {
        return this.getAllBy({ region }).then(response => ClimateForecastAssembler.toEntitiesFromResponse(response));
    }
}
