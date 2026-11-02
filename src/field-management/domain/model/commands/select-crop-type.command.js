/**
 * Chooses the crop of a campaign.
 *
 * @class SelectCropTypeCommand
 */
export class SelectCropTypeCommand {
    /**
     * @param {Object} props - Command data.
     * @param {number} props.campaignId - Campaign of the crop.
     * @param {string} props.cropType - Crop (`CropType`).
     */
    constructor({ campaignId, cropType }) {
        this.campaignId = campaignId;
        this.cropType = cropType;
    }
}
