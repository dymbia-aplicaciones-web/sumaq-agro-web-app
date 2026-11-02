/**
 * Categories of the field expenses recorded in the cost ledger.
 * @readonly
 * @enum {string}
 */
export const ExpenseCategory = Object.freeze({
    /** Seeds, fertilizers... */
    INPUTS: 'INPUTS',
    /** Daily wages. */
    LABOR: 'LABOR',
    FREIGHT: 'FREIGHT'
});

/**
 * One expense of the ledger.
 *
 * @class ExpenseEntry
 */
export class ExpenseEntry {
    /**
     * @param {Object} props - Entity attributes.
     * @param {number} props.id - Expense identifier inside its ledger.
     * @param {number} props.ledgerId - Cost ledger.
     * @param {string} props.category - Expense category (`ExpenseCategory`).
     * @param {string} props.description - Input, task or route.
     * @param {number} props.quantity - Quantity (workers × days for labor).
     * @param {import('../../../../shared/domain/model/money.js').Money} props.unitPrice - Unit price.
     * @param {Date} props.expenseDate - Date of the expense.
     * @param {string} [props.notes=''] - Notes.
     * @param {string} [props.clientSyncId=''] - Id created on the device when the expense is saved offline.
     */
    constructor({ id, ledgerId, category, description, quantity, unitPrice, expenseDate, notes, clientSyncId }) {
        this.id = id;
        this.ledgerId = ledgerId;
        this.category = category;
        this.description = description;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.expenseDate = expenseDate;
        this.notes = notes ?? '';
        this.clientSyncId = clientSyncId ?? '';
    }

    /** @returns {import('../../../../shared/domain/model/money.js').Money} quantity * unit price */
    total() {
        return this.unitPrice.multiply(this.quantity);
    }
}
