/**
 * One month in the institutional NDVI trend projection.
 *
 * @typedef {Object} NdviTrendPoint
 * @property {string} month
 * @property {number} value
 */

/**
 * Read-only institutional projection for the cooperative director dashboard.
 *
 * @class CooperativeDashboard
 */
export class CooperativeDashboard {
    /**
     * @param {Object} props - Projection attributes.
     * @param {number} props.id
     * @param {number} props.directorUserId
     * @param {string} props.cooperativeName
     * @param {string} props.campaignName
     * @param {number} props.activeMembers
     * @param {number} props.monitoredHectares
     * @param {number} props.collectionTons
     * @param {number} props.collectionGoalTons
     * @param {number} props.optimalPlotsPercentage
     * @param {number} props.stressedPlotsPercentage
     * @param {number} props.averageCostPerHectare
     * @param {NdviTrendPoint[]} props.ndviTrend
     * @param {number} props.evaluatedLots
     * @param {number} props.specialtyCoffeePercentage
     * @param {number} props.firstGradePotatoPercentage
     * @param {number} props.lossLotsPercentage
     */
    constructor(props) {
        this.id = props.id;
        this.directorUserId = props.directorUserId;
        this.cooperativeName = props.cooperativeName;
        this.campaignName = props.campaignName;
        this.activeMembers = props.activeMembers;
        this.monitoredHectares = props.monitoredHectares;
        this.collectionTons = props.collectionTons;
        this.collectionGoalTons = props.collectionGoalTons;
        this.optimalPlotsPercentage = props.optimalPlotsPercentage;
        this.stressedPlotsPercentage = props.stressedPlotsPercentage;
        this.averageCostPerHectare = props.averageCostPerHectare;
        this.ndviTrend = props.ndviTrend;
        this.evaluatedLots = props.evaluatedLots;
        this.specialtyCoffeePercentage = props.specialtyCoffeePercentage;
        this.firstGradePotatoPercentage = props.firstGradePotatoPercentage;
        this.lossLotsPercentage = props.lossLotsPercentage;
    }

    /** @returns {number} Collected tons as a percentage of the goal. */
    get collectionProgress() {
        return this.collectionGoalTons === 0 ? 0 : (this.collectionTons / this.collectionGoalTons) * 100;
    }
}
