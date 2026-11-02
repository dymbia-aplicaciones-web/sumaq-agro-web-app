import {PestReport} from "../../domain/model/entities/pest-report.entity.js";
import {resourcesFromResponse} from "../../../shared/infrastructure/base-assembler.js";

/**
 * Maps pest report entities to and from API resources.
 *
 * @class PestReportAssembler
 */
export class PestReportAssembler {
    /**
     * @param {Object} resource - Report resource.
     * @returns {PestReport} Report entity.
     */
    static toEntityFromResource(resource) {
        return new PestReport({
            id: Number(resource.id),
            plotId: resource.plotId,
            plotName: resource.plotName,
            reporterId: resource.reporterId,
            description: resource.description,
            severity: resource.severity,
            status: resource.status,
            photo: resource.photo,
            clientSyncId: resource.clientSyncId
        });
    }

    /**
     * @param {PestReport} entity - Report entity.
     * @returns {Object} Report resource.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id, plotId: entity.plotId, plotName: entity.plotName,
            reporterId: entity.reporterId, description: entity.description,
            severity: entity.severity, status: entity.status,
            photo: entity.photo, clientSyncId: entity.clientSyncId
        };
    }

    /**
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with reports.
     * @returns {PestReport[]} Report entities.
     */
    static toEntitiesFromResponse(response) {
        return resourcesFromResponse(response, 'reports').map(resource => this.toEntityFromResource(resource));
    }
}
