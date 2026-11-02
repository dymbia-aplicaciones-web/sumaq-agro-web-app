/**
 * Asks for the PDF cost report of a campaign.
 *
 * @class ExportCampaignCostReportCommand
 */
export class ExportCampaignCostReportCommand {
    /**
     * @param {Object} props - Command data.
     * @param {number} props.campaignId - Campaign of the report.
     */
    constructor({ campaignId }) {
        this.campaignId = campaignId;
    }
}
