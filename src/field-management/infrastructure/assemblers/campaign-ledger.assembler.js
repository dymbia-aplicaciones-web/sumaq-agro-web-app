import {Money} from "../../../shared/domain/model/money.js";
import {fromApiDate, resourcesFromResponse, toApiDate} from "../../../shared/infrastructure/base-assembler.js";
import {CampaignLedger} from "../../domain/model/entities/campaign-ledger.entity.js";
import {ExpenseEntry} from "../../domain/model/entities/expense-entry.entity.js";

/**
 * Maps cost ledger entities (and their expenses) to and from API resources.
 *
 * @class CampaignLedgerAssembler
 */
export class CampaignLedgerAssembler {
    /**
     * Converts a response with ledgers to an array of CampaignLedger entities.
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - The API response containing ledgers.
     * @returns {CampaignLedger[]} An array of CampaignLedger entities.
     */
    static toEntitiesFromResponse(response) {
        return resourcesFromResponse(response, 'ledgers').map(resource => this.toEntityFromResource(resource));
    }

    /**
     * Converts a ledger resource to a CampaignLedger entity.
     * @param {Object} resource - The resource to convert.
     * @returns {CampaignLedger} The converted CampaignLedger entity.
     */
    static toEntityFromResource(resource) {
        const id = Number(resource.id);
        return new CampaignLedger({
            id,
            campaignId: resource.campaignId,
            entries: (resource.entries ?? []).map(entry => this.#toExpenseEntry(entry, id)),
            expectedYield: resource.expectedYield,
            actualYield: resource.actualYield,
            yieldUnit: resource.yieldUnit,
            frozen: resource.frozen ?? false
        });
    }

    /**
     * Converts a CampaignLedger entity to a ledger resource.
     * @param {CampaignLedger} entity - The entity to convert.
     * @returns {Object} The converted ledger resource.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id,
            campaignId: entity.campaignId,
            expectedYield: entity.expectedYield,
            actualYield: entity.actualYield,
            yieldUnit: entity.yieldUnit,
            frozen: entity.frozen,
            entries: entity.entries.map(entry => this.#toExpenseResource(entry))
        };
    }

    /**
     * Converts an expense as the API sends it (`expenseDate` as `YYYY-MM-DD`).
     * @param {Object} resource - The expense resource.
     * @param {number} ledgerId - Ledger that owns the expense.
     * @returns {ExpenseEntry} Expense entity.
     */
    static #toExpenseEntry(resource, ledgerId) {
        return new ExpenseEntry({
            id: Number(resource.id),
            ledgerId,
            category: resource.category,
            description: resource.description,
            quantity: resource.quantity,
            unitPrice: new Money(resource.unitPrice),
            expenseDate: fromApiDate(resource.expenseDate),
            notes: resource.notes,
            clientSyncId: resource.clientSyncId
        });
    }

    /**
     * Converts an expense to its resource.
     * @param {ExpenseEntry} entry - The expense to convert.
     * @returns {Object} Expense resource.
     */
    static #toExpenseResource(entry) {
        return {
            id: entry.id,
            category: entry.category,
            description: entry.description,
            quantity: entry.quantity,
            unitPrice: entry.unitPrice.amount,
            expenseDate: toApiDate(entry.expenseDate),
            notes: entry.notes,
            clientSyncId: entry.clientSyncId
        };
    }
}
