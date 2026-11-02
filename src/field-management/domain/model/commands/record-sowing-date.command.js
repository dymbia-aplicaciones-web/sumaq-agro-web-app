/**
 * Records the sowing date. It starts the satellite monitoring (policy P4).
 *
 * @class RecordSowingDateCommand
 */
export class RecordSowingDateCommand {
    /**
     * @param {Object} props - Command data.
     * @param {number} props.campaignId - Campaign sown.
     * @param {Date} props.sowingDate - Sowing date.
     */
    constructor({ campaignId, sowingDate }) {
        this.campaignId = campaignId;
        this.sowingDate = sowingDate;
    }
}
