/**
 * Closes a crop campaign.
 *
 * @class CloseCropCampaignCommand
 */
export class CloseCropCampaignCommand {
    /**
     * @param {Object} props - Command data.
     * @param {number} props.campaignId - Campaign to close.
     */
    constructor({ campaignId }) {
        this.campaignId = campaignId;
    }
}
