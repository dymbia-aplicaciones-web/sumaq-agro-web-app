/**
 * Reassigns plots or edits the details of an existing technical advisor.
 *
 * @class ReassignTechnicalAdvisorCommand
 */
export class ReassignTechnicalAdvisorCommand {
    /**
     * @param {number} id - Advisor record.
     * @param {string} name - Name of the advisor.
     * @param {string} cipCode - CIP registration code.
     * @param {string} phone - Contact phone.
     * @param {number} assignedPlotsCount - Plots supervised by the advisor.
     */
    constructor(id, name, cipCode, phone, assignedPlotsCount) {
        this.id = id;
        this.name = name;
        this.cipCode = cipCode;
        this.phone = phone;
        this.assignedPlotsCount = assignedPlotsCount;
    }
}
