import {fromApiDate, toApiDate} from "../../../shared/infrastructure/base-assembler.js";
import {PendingOperationType} from "../offline/pending-operation.js";
import {RecordDailyLaborExpenseCommand} from "../../domain/model/commands/record-daily-labor-expense.command.js";
import {RecordFieldFreightExpenseCommand} from "../../domain/model/commands/record-field-freight-expense.command.js";
import {RecordInputExpenseCommand} from "../../domain/model/commands/record-input-expense.command.js";
import {ExpenseCategory} from "../../domain/model/entities/expense-entry.entity.js";

/**
 * Maps the expense commands recorded without connection to the operations that
 * `OfflineSync` keeps on the device (dates as `YYYY-MM-DD`), and back.
 *
 * @class PendingExpenseAssembler
 */
export class PendingExpenseAssembler {
    /**
     * Converts an expense command to a pending operation.
     * @param {RecordInputExpenseCommand|RecordDailyLaborExpenseCommand|RecordFieldFreightExpenseCommand} command - The expense recorded without connection.
     * @returns {import('../offline/pending-operation.js').PendingOperation} Pending operation.
     */
    static toOperation(command) {
        return {
            uuid: command.clientSyncId,
            type: PendingOperationType.FIELD_EXPENSE,
            payload: this.#toPayload(command),
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Converts a pending operation back to its expense command.
     * @param {import('../offline/pending-operation.js').PendingOperation} operation - Operation kept on the device.
     * @returns {RecordInputExpenseCommand|RecordDailyLaborExpenseCommand|RecordFieldFreightExpenseCommand} Expense command.
     */
    static toCommand(operation) {
        const record = operation.payload;
        const expenseDate = fromApiDate(record.expenseDate);
        switch (record.category) {
            case ExpenseCategory.INPUTS:
                return new RecordInputExpenseCommand({ ...record, expenseDate });
            case ExpenseCategory.LABOR:
                return new RecordDailyLaborExpenseCommand({ ...record, expenseDate });
            default:
                return new RecordFieldFreightExpenseCommand({ ...record, expenseDate });
        }
    }

    static #toPayload(command) {
        const base = {
            ledgerId: command.ledgerId,
            clientSyncId: command.clientSyncId,
            expenseDate: toApiDate(command.expenseDate)
        };
        if (command instanceof RecordInputExpenseCommand) {
            return { ...base, category: ExpenseCategory.INPUTS, inputName: command.inputName, quantity: command.quantity, unitPrice: command.unitPrice };
        }
        if (command instanceof RecordDailyLaborExpenseCommand) {
            return { ...base, category: ExpenseCategory.LABOR, activity: command.activity, workers: command.workers, days: command.days, dailyWage: command.dailyWage };
        }
        return { ...base, category: ExpenseCategory.FREIGHT, route: command.route, cost: command.cost };
    }
}
