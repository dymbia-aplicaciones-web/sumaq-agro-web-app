import {FieldInspection} from "../../domain/model/entities/field-inspection.entity.js";
import {resourcesFromResponse} from "../../../shared/infrastructure/base-assembler.js";

/**
 * Maps field inspection entities to and from API resources.
 *
 * @class FieldInspectionAssembler
 */
export class FieldInspectionAssembler {
    /**
     * @param {Object} resource - Inspection resource.
     * @returns {FieldInspection} Inspection entity.
     */
    static toEntityFromResource(resource) {
        return new FieldInspection({
            id: Number(resource.id),
            reportId: resource.reportId,
            scheduledAt: resource.scheduledAt,
            notes: resource.notes,
            status: resource.status,
            completedAt: resource.completedAt,
            inspectorUserId: resource.inspectorUserId
        });
    }

    /**
     * @param {FieldInspection} entity - Inspection entity.
     * @returns {Object} Inspection resource.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id, reportId: entity.reportId,
            scheduledAt: entity.scheduledAt, notes: entity.notes,
            status: entity.status, completedAt: entity.completedAt, inspectorUserId: entity.inspectorUserId
        };
    }

    /**
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with inspections.
     * @returns {FieldInspection[]} Inspection entities.
     */
    static toEntitiesFromResponse(response) {
        return resourcesFromResponse(response, 'inspections').map(resource => this.toEntityFromResource(resource));
    }
}
