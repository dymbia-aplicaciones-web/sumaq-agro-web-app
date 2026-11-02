/**
 * Records the daily wages paid to the field workers.
 *
 * @class RecordDailyLaborExpenseCommand
 */
export class RecordDailyLaborExpenseCommand {
    /**
     * @param {Object} props - Command data.
     * @param {number} props.ledgerId - Cost ledger of the campaign.
     * @param {string} props.activity - Field task, for example "Harvest" (US-38).
     * @param {number} props.workers - Number of workers.
     * @param {number} props.days - Number of days worked.
     * @param {number} props.dailyWage - Wage per worker per day, in soles.
     * @param {Date} props.expenseDate - Date of the expense.
     * @param {string} [props.clientSyncId] - Code generated on the device; it keeps the
     * expense from being saved twice when it is recorded offline and synchronized later.
     */
    constructor({ ledgerId, activity, workers, days, dailyWage, expenseDate, clientSyncId }) {
        this.ledgerId = ledgerId;
        this.activity = activity;
        this.workers = workers;
        this.days = days;
        this.dailyWage = dailyWage;
        this.expenseDate = expenseDate;
        this.clientSyncId = clientSyncId ?? crypto.randomUUID();
    }
}
