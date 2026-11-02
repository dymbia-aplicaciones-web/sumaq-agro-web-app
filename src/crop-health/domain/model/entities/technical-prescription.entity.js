import {requireDate, requireId, requireText} from "../validation.js";

/**
 * Agronomist's technical prescription to treat a reported pest or disease.
 *
 * @class TechnicalPrescription
 */
export class TechnicalPrescription {
    /**
     * @param {Object} props - Entity attributes.
     * @param {number} [props.id=0] - Prescription identifier.
     * @param {number} props.reportId - Associated pest report identifier.
     * @param {number} props.agronomistId - Agronomist writing the prescription.
     * @param {string} props.recommendedProducts - Recommended agrochemical or organic products.
     * @param {string} props.dosageInstructions - Dosage and safety instructions.
     * @param {string} props.applicationDate - Target date when the treatment should be applied.
     */
    constructor({ id, reportId, agronomistId, recommendedProducts, dosageInstructions, applicationDate }) {
        requireId(reportId);
        requireId(agronomistId);
        requireText(recommendedProducts);
        requireText(dosageInstructions);
        requireDate(applicationDate);
        this.id = id ?? 0;
        this.reportId = reportId;
        this.agronomistId = agronomistId;
        this.recommendedProducts = recommendedProducts;
        this.dosageInstructions = dosageInstructions;
        this.applicationDate = applicationDate;
    }
}
