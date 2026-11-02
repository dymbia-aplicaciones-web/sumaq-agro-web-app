/**
 * Records the yield actually harvested (policy P10: when Harvest Certification
 * weighs the delivered batch, or when the producer closes the campaign).
 *
 * @class RecordActualYieldCommand
 */
export class RecordActualYieldCommand {
    /**
     * @param {Object} props - Command data.
     * @param {number} props.ledgerId - Cost ledger of the campaign.
     * @param {number} props.actualYield - Harvested yield.
     * @param {string} props.unit - Unit of the yield (`YieldUnit`).
     */
    constructor({ ledgerId, actualYield, unit }) {
        this.ledgerId = ledgerId;
        this.actualYield = actualYield;
        this.unit = unit;
    }
}
