/**
 * Technical advisor (agronomist) assigned to a cooperative.
 *
 * @class TechnicalAdvisor
 */
export class TechnicalAdvisor {
    /**
     * @param {Object} props - Advisor attributes.
     * @param {number} [props.id=0] - Advisor record.
     * @param {number} props.cooperativeId - Cooperative.
     * @param {number} [props.userId] - Linked account of the agronomist.
     * @param {string} props.name - Name.
     * @param {string} props.cipCode - CIP registration code.
     * @param {string} props.phone - Contact phone.
     * @param {number} props.assignedPlotsCount - Plots supervised.
     */
    constructor({ id, cooperativeId, userId, name, cipCode, phone, assignedPlotsCount }) {
        this.id = id ?? 0;
        this.cooperativeId = cooperativeId;
        this.userId = userId;
        this.name = name;
        this.cipCode = cipCode;
        this.phone = phone;
        this.assignedPlotsCount = assignedPlotsCount;
    }

    /**
     * @param {string} name - Name.
     * @param {string} cipCode - CIP registration code.
     * @param {string} phone - Contact phone.
     * @param {number} assignedPlotsCount - Plots supervised.
     * @throws {Error} When the name or the CIP code is empty.
     */
    updateDetails(name, cipCode, phone, assignedPlotsCount) {
        if (!name || name.trim().length === 0) throw new Error('El nombre del asesor es obligatorio.');
        if (!cipCode || cipCode.trim().length === 0) throw new Error('La colegiatura CIP es obligatoria.');
        this.name = name.trim();
        this.cipCode = cipCode.trim();
        this.phone = phone ? phone.trim() : '';
        this.assignedPlotsCount = Math.max(0, assignedPlotsCount);
    }
}
