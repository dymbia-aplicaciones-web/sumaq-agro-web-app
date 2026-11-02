/**
 * Chooses the seed variety of a campaign.
 *
 * @class SpecifySeedVarietyCommand
 */
export class SpecifySeedVarietyCommand {
    /**
     * @param {Object} props - Command data.
     * @param {number} props.campaignId - Campaign of the variety.
     * @param {string} props.varietyName - Seed variety.
     * @param {boolean} props.custom - `true` when the producer typed a variety that is not in the list.
     */
    constructor({ campaignId, varietyName, custom }) {
        this.campaignId = campaignId;
        this.varietyName = varietyName;
        this.custom = custom;
    }
}
