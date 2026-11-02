/**
 * Records a freight cost (inputs or harvest transport).
 *
 * @class RecordFieldFreightExpenseCommand
 */
export class RecordFieldFreightExpenseCommand {
    /**
     * @param {Object} props - Command data.
     * @param {number} props.ledgerId - Cost ledger of the campaign.
     * @param {string} props.route - For example, "Chacra – Acopio".
     * @param {number} props.cost - Total cost, in soles.
     * @param {Date} props.expenseDate - Date of the expense.
     * @param {string} [props.clientSyncId] - Code generated on the device; it keeps the
     * expense from being saved twice when it is recorded offline and synchronized later.
     */
    constructor({ ledgerId, route, cost, expenseDate, clientSyncId }) {
        this.ledgerId = ledgerId;
        this.route = route;
        this.cost = cost;
        this.expenseDate = expenseDate;
        this.clientSyncId = clientSyncId ?? crypto.randomUUID();
    }
}
