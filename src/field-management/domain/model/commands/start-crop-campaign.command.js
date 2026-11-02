/**
 * Starts a new crop campaign on a plot.
 *
 * @class StartCropCampaignCommand
 */
export class StartCropCampaignCommand {
    /**
     * @param {Object} props - Command data.
     * @param {number} props.plotId - Plot of the campaign.
     * @param {string} props.season - Agricultural season, for example `2026-I`.
     */
    constructor({ plotId, season }) {
        this.plotId = plotId;
        this.season = season;
    }
}
