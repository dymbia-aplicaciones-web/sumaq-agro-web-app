import {TechnicalPrescription} from "../../domain/model/entities/technical-prescription.entity.js";
import {resourcesFromResponse} from "../../../shared/infrastructure/base-assembler.js";

/**
 * Maps technical prescription entities to and from API resources.
 *
 * @class TechnicalPrescriptionAssembler
 */
export class TechnicalPrescriptionAssembler {
    /**
     * @param {Object} resource - Prescription resource.
     * @returns {TechnicalPrescription} Prescription entity.
     */
    static toEntityFromResource(resource) {
        return new TechnicalPrescription({
            id: Number(resource.id),
            reportId: resource.reportId,
            agronomistId: resource.agronomistId,
            recommendedProducts: resource.recommendedProducts,
            dosageInstructions: resource.dosageInstructions,
            applicationDate: resource.applicationDate
        });
    }

    /**
     * @param {TechnicalPrescription} entity - Prescription entity.
     * @returns {Object} Prescription resource.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id, reportId: entity.reportId, agronomistId: entity.agronomistId,
            recommendedProducts: entity.recommendedProducts, dosageInstructions: entity.dosageInstructions,
            applicationDate: entity.applicationDate
        };
    }

    /**
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response with prescriptions.
     * @returns {TechnicalPrescription[]} Prescription entities.
     */
    static toEntitiesFromResponse(response) {
        return resourcesFromResponse(response, 'prescriptions').map(resource => this.toEntityFromResource(resource));
    }
}
