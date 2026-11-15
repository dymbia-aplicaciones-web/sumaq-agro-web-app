import {QualityCertificate} from "../domain/model/quality-certificate.entity.js";
import {resourcesFromResponse} from "../../shared/infrastructure/base-assembler.js";

/**
 * Maps Quality certificate resources into domain entities and back.
 *
 * @class QualityCertificateAssembler
 */
export class QualityCertificateAssembler {
    /**
     * @param {Object} resource - Quality certificate resource payload.
     * @returns {QualityCertificate} Quality certificate entity.
     */
    static toEntityFromResource(resource) {
        return new QualityCertificate({...resource, id: Number(resource.id),
            sha256Hash: resource.certificateHash ?? resource.sha256Hash});
    }

    /**
     * Parses Quality certificate resources from a response and maps them into entities.
     *
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with Quality certificate resources.
     * @returns {QualityCertificate[]} Quality certificate entities.
     */
    static toEntitiesFromResponse(response) {
        return resourcesFromResponse(response, 'certificates').map(resource => this.toEntityFromResource(resource));
    }

    /**
     * @param {QualityCertificate} entity - Quality certificate entity.
     * @returns {Object} Quality certificate resource.
     */
    static toResourceFromEntity(entity) {
        return {...entity};
    }
}
