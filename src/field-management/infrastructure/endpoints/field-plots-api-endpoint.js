import {BaseEndpoint} from "../../../shared/infrastructure/base-endpoint.js";
import {FieldPlotAssembler} from "../assemblers/field-plot.assembler.js";

const fieldPlotsEndpointPath = import.meta.env.VITE_FIELD_PLOTS_ENDPOINT_PATH || '/field-plots';

/**
 * HTTP endpoint for the field plots resource (`/field-plots`).
 *
 * @class FieldPlotsApiEndpoint
 * @extends BaseEndpoint
 */
export class FieldPlotsApiEndpoint extends BaseEndpoint {
    /** @param {import('../../../shared/infrastructure/base-api.js').BaseApi} baseApi - Configured API client owner. */
    constructor(baseApi) {
        super(baseApi, fieldPlotsEndpointPath);
    }

    /**
     * Loads the plots of one producer.
     * @param {number} ownerUserId - Producer who owns the plots.
     * @returns {Promise<import('../../domain/model/entities/field-plot.entity.js').FieldPlot[]>} Plots of the producer.
     */
    getByOwner(ownerUserId) {
        return this.getAllBy({ ownerUserId }).then(response => FieldPlotAssembler.toEntitiesFromResponse(response));
    }

    /**
     * Loads the plots with the given IDs; the ones that no longer exist are skipped.
     * @param {number[]} ids - The IDs of the plots.
     * @returns {Promise<import('../../domain/model/entities/field-plot.entity.js').FieldPlot[]>} Plots found.
     */
    async getByIds(ids) {
        const plots = await Promise.all([...new Set(ids)].map(async id => {
            const response = await this.http.get(`${this.endpointPath}/${id}`, {
                validateStatus: status => status === 200 || status === 404
            });
            return response.status === 200 ? FieldPlotAssembler.toEntityFromResource(response.data) : null;
        }));
        return plots.filter(Boolean);
    }
}
