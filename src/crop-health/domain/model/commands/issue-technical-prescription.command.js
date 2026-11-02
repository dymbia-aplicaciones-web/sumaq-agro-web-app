/**
 * Command to issue a technical treatment prescription for a pest report.
 *
 * @class IssueTechnicalPrescriptionCommand
 */
export class IssueTechnicalPrescriptionCommand {
    /**
     * @param {Object} props - Command payload.
     * @param {number} props.reportId - Target pest report identifier.
     * @param {number} props.agronomistId - Agronomist issuing the prescription.
     * @param {string} props.recommendedProducts - Recommended products to apply.
     * @param {string} props.dosageInstructions - Dosage and handling instructions.
     * @param {string} props.applicationDate - Suggested application date (`YYYY-MM-DD`).
     */
    constructor({ reportId, agronomistId, recommendedProducts, dosageInstructions, applicationDate }) {
        this.reportId = reportId;
        this.agronomistId = agronomistId;
        this.recommendedProducts = recommendedProducts;
        this.dosageInstructions = dosageInstructions;
        this.applicationDate = applicationDate;
    }
}
