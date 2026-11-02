/**
 * Crops supported by SumaqAgro.
 * @readonly
 * @enum {string}
 */
export const CropType = Object.freeze({
    ANDEAN_POTATO: 'ANDEAN_POTATO',
    SPECIALTY_COFFEE: 'SPECIALTY_COFFEE'
});

/**
 * Status of a crop campaign.
 * @readonly
 * @enum {string}
 */
export const CampaignStatus = Object.freeze({
    IN_PROGRESS: 'IN_PROGRESS',
    FINISHED: 'FINISHED'
});

/**
 * Crop campaign of a plot (crop, seed variety and sowing date).
 *
 * @class CropCampaign
 */
export class CropCampaign {
    /**
     * @param {Object} props - Entity attributes.
     * @param {number} props.id - Campaign identifier.
     * @param {number} props.plotId - Plot of the campaign.
     * @param {string} props.season - Agricultural season, e.g. `2026-I`.
     * @param {string} props.cropType - Crop (`CropType`).
     * @param {string} props.seedVariety - Seed variety sown.
     * @param {boolean} [props.customSeedVariety=false] - The producer typed a variety that is not in the list.
     * @param {?Date} [props.sowingDate=null] - Sowing date.
     * @param {string} [props.status=CampaignStatus.IN_PROGRESS] - Status.
     */
    constructor({ id, plotId, season, cropType, seedVariety, customSeedVariety, sowingDate, status }) {
        this.id = id;
        this.plotId = plotId;
        this.season = season;
        this.cropType = cropType;
        this.seedVariety = seedVariety;
        this.customSeedVariety = customSeedVariety ?? false;
        this.sowingDate = sowingDate ?? null;
        this.status = status ?? CampaignStatus.IN_PROGRESS;
    }

    /** @returns {boolean} `true` while the campaign is in progress. */
    isActive() {
        return this.status === CampaignStatus.IN_PROGRESS;
    }
}
