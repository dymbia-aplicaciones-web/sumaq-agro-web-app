/**
 * Origin information exposed by Profiles for a member's registered plots.
 *
 * @typedef {Object} MemberPlot
 * @property {number} id
 * @property {string} name
 * @property {string} region
 * @property {string} coordinates
 * @property {number} campaignId
 * @property {string} variety
 * @property {'ANDEAN_POTATO'|'SPECIALTY_COFFEE'} cropType
 */

/**
 * Read model of a cooperative member used by the institutional dashboard.
 *
 * @class CooperativeMember
 */
export class CooperativeMember {
    /**
     * @param {Object} props - Member attributes.
     * @param {number} props.id - Membership identifier.
     * @param {number} props.cooperativeId - Cooperative.
     * @param {string} props.fullName - Full name of the member.
     * @param {boolean} props.active - `true` while the membership is active.
     * @param {?number} [props.userId=null] - Linked account; absent legacy links never imply equality with the membership ID.
     * @param {MemberPlot[]} [props.plots=[]] - Plot references owned by this member, supplied by the Profiles read model.
     */
    constructor({ id, cooperativeId, fullName, active, userId, plots }) {
        this.id = id;
        this.cooperativeId = cooperativeId;
        this.fullName = fullName;
        this.active = active;
        this.userId = userId ?? null;
        this.plots = plots ?? [];
    }

    /** @returns {string} Display name used by member selectors in other contexts. */
    get name() {
        return this.fullName;
    }
}
