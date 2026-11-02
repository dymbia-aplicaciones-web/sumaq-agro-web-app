/**
 * Invites a new technical advisor to the cooperative team.
 *
 * @class InviteTechnicalAdvisorCommand
 */
export class InviteTechnicalAdvisorCommand {
    /**
     * @param {number} cooperativeId - Cooperative of the team.
     * @param {string} name - Name of the advisor.
     * @param {string} cipCode - CIP registration code.
     * @param {string} phone - Contact phone.
     * @param {number} assignedPlotsCount - Plots supervised by the advisor.
     */
    constructor(cooperativeId, name, cipCode, phone, assignedPlotsCount) {
        this.cooperativeId = cooperativeId;
        this.name = name;
        this.cipCode = cipCode;
        this.phone = phone;
        this.assignedPlotsCount = assignedPlotsCount;
    }
}
