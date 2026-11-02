/**
 * Sets the yield the producer expects to harvest.
 *
 * @class SetExpectedYieldCommand
 */
export class SetExpectedYieldCommand {
    /**
     * @param {Object} props - Command data.
     * @param {number} props.ledgerId - Cost ledger of the campaign.
     * @param {number} props.expectedYield - Expected harvest.
     * @param {string} props.unit - Unit of the yield (`YieldUnit`).
     */
    constructor({ ledgerId, expectedYield, unit }) {
        this.ledgerId = ledgerId;
        this.expectedYield = expectedYield;
        this.unit = unit;
    }
}
