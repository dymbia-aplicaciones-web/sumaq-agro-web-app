import {AgroclimaticAlert} from "../../domain/model/entities/agroclimatic-alert.entity.js";
import {resourcesFromResponse} from "../../../shared/infrastructure/base-assembler.js";

/**
 * Maps agroclimatic alert entities to and from API resources.
 *
 * @class AgroclimaticAlertAssembler
 */
export class AgroclimaticAlertAssembler {
    /**
     * @param {Object} resource - Alert resource.
     * @returns {AgroclimaticAlert} Alert entity.
     */
    static toEntityFromResource(resource) {
        return new AgroclimaticAlert({
            id: Number(resource.id),
            title: resource.title,
            description: resource.description,
            severity: resource.severity,
            region: resource.region,
            issuedAt: resource.issuedAt,
            source: resource.source
        });
    }

    /**
     * @param {AgroclimaticAlert} entity - Alert entity.
     * @returns {Object} Alert resource.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id, title: entity.title, description: entity.description,
            severity: entity.severity, region: entity.region,
            issuedAt: entity.issuedAt, source: entity.source
        };
    }

    /**
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with alerts.
     * @returns {AgroclimaticAlert[]} Alert entities.
     */
    static toEntitiesFromResponse(response) {
        return resourcesFromResponse(response, 'alerts').map(resource => this.toEntityFromResource(resource));
    }
}
