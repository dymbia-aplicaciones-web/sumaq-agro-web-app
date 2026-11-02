/**
 * Records the purchase of an input (seed, fertilizer, etc.).
 *
 * @class RecordInputExpenseCommand
 */
export class RecordInputExpenseCommand {
    /**
     * @param {Object} props - Command data.
     * @param {number} props.ledgerId - Cost ledger of the campaign.
     * @param {string} props.inputName - Input bought.
     * @param {number} props.quantity - Quantity bought.
     * @param {number} props.unitPrice - Price per unit, in soles.
     * @param {Date} props.expenseDate - Date of the expense.
     * @param {string} [props.clientSyncId] - Code generated on the device; it keeps the
     * expense from being saved twice when it is recorded offline and synchronized later.
     */
    constructor({ ledgerId, inputName, quantity, unitPrice, expenseDate, clientSyncId }) {
        this.ledgerId = ledgerId;
        this.inputName = inputName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.expenseDate = expenseDate;
        this.clientSyncId = clientSyncId ?? crypto.randomUUID();
    }
}
