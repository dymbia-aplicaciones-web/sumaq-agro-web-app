import {HarvestBatch} from "../domain/model/harvest-batch.entity.js";
import {resourcesFromResponse} from "../../shared/infrastructure/base-assembler.js";

/**
 * Maps Harvest batch resources into domain entities and back.
 *
 * @class HarvestBatchAssembler
 */
export class HarvestBatchAssembler {
    /**
     * @param {Object} resource - Harvest batch resource payload.
     * @returns {HarvestBatch} Harvest batch entity.
     */
    static toEntityFromResource(resource) {
        return new HarvestBatch({
            ...resource, id: Number(resource.id),
            code: resource.batchCode ?? resource.code,
            collectedAt: resource.harvestedOn ?? resource.collectedAt,
            grossKg: resource.netWeightKg ?? resource.grossKg,
            tareKg: resource.netWeightKg == null ? resource.tareKg : 0,
            sampleKg: resource.sampleWeightKg ?? resource.sampleKg,
            potatoGrading: resource.firstCaliberPercentage == null ? resource.potatoGrading : {
                firstPercentage: resource.firstCaliberPercentage,
                secondPercentage: resource.secondCaliberPercentage,
                thirdPercentage: resource.thirdCaliberPercentage,
                weevilDamagePercentage: resource.pestDamagePercentage
            },
            coffeeCupping: resource.coffeeCuppingScore == null ? resource.coffeeCupping : { totalScore: resource.coffeeCuppingScore }
        });
    }

    /**
     * Parses Harvest batch resources from a response and maps them into entities.
     *
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with Harvest batch resources.
     * @returns {HarvestBatch[]} Harvest batch entities.
     */
    static toEntitiesFromResponse(response) {
        return resourcesFromResponse(response, 'batches').map(resource => this.toEntityFromResource(resource));
    }

    /**
     * @param {HarvestBatch} entity - Harvest batch entity.
     * @returns {Object} Harvest batch resource.
     */
    static toResourceFromEntity(entity) {
        return {...entity};
    }
}
