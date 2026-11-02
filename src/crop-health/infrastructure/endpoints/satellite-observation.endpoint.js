import {BaseEndpoint} from "../../../shared/infrastructure/base-endpoint.js";
import {SatelliteObservationAssembler} from "../assemblers/satellite-observation.assembler.js";

const satelliteObservationsEndpointPath = import.meta.env.VITE_SATELLITE_OBSERVATIONS_ENDPOINT_PATH;

/**
 * HTTP endpoint for managing remote sensing and satellite data (`/satellite-observations`).
 *
 * @class SatelliteObservationsApiEndpoint
 * @extends BaseEndpoint
 */
export class SatelliteObservationsApiEndpoint extends BaseEndpoint {
    /** @param {import('../../../shared/infrastructure/base-api.js').BaseApi} baseApi - Configured API client owner. */
    constructor(baseApi) {
        super(baseApi, satelliteObservationsEndpointPath);
    }

    /**
     * Fetches all satellite observations associated with a specific plot.
     * @param {number} plotId - The unique identifier of the plot.
     * @returns {Promise<import('../../domain/model/entities/satellite-observation.entity.js').SatelliteObservation[]>} Observations.
     */
    getByPlot(plotId) {
        return this.getAllBy({ plotId }).then(response => SatelliteObservationAssembler.toEntitiesFromResponse(response));
    }
}
