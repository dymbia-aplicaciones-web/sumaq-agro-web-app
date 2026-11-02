import {Money} from "../../../../shared/domain/model/money.js";

/**
 * Unit of the harvest.
 * @readonly
 * @enum {string}
 */
export const YieldUnit = Object.freeze({
    /** Potato. */
    SACK: 'SACK',
    /** Coffee (46 kg). */
    QUINTAL: 'QUINTAL'
});

/**
 * Cost ledger of a campaign: expenses and expected/actual yield.
 *
 * @class CampaignLedger
 */
export class CampaignLedger {
    /**
     * @param {Object} props - Entity attributes.
     * @param {number} props.id - Ledger identifier.
     * @param {number} props.campaignId - Campaign of the ledger.
     * @param {import('./expense-entry.entity.js').ExpenseEntry[]} [props.entries=[]] - Expenses.
     * @param {number} [props.expectedYield=0] - Expected harvest.
     * @param {?number} [props.actualYield=null] - Actual harvest.
     * @param {string} [props.yieldUnit=YieldUnit.SACK] - Unit of the harvest.
     * @param {boolean} [props.frozen=false] - A frozen ledger does not accept more expenses.
     * @param {string} [props.currency='PEN'] - Currency.
     */
    constructor({ id, campaignId, entries, expectedYield, actualYield, yieldUnit, frozen, currency }) {
        this.id = id;
        this.campaignId = campaignId;
        this.entries = entries ?? [];
        this.expectedYield = expectedYield ?? 0;
        this.actualYield = actualYield ?? null;
        this.yieldUnit = yieldUnit ?? YieldUnit.SACK;
        this.frozen = frozen ?? false;
        this.currency = currency ?? 'PEN';
    }

    /**
     * Most recent first. If a category is given, only that one.
     * @param {?string} [category] - Expense category, or `null` for all of them.
     * @returns {import('./expense-entry.entity.js').ExpenseEntry[]} Expenses.
     */
    expenseHistory(category) {
        return [...this.entries]
            .sort((a, b) => b.expenseDate.getTime() - a.expenseDate.getTime())
            .filter(entry => !category || entry.category === category);
    }

    /** @returns {Money} Sum of all expenses. */
    totalInvestment() {
        return sumOf(this.entries, this.currency);
    }

    /**
     * @param {string} category - Expense category.
     * @returns {Money} Sum of the expenses of the category.
     */
    totalByCategory(category) {
        return sumOf(this.entries.filter(entry => entry.category === category), this.currency);
    }

    /**
     * @param {string} category - Expense category.
     * @returns {number} Percentage (0-100) of the total investment.
     */
    percentageByCategory(category) {
        const total = this.totalInvestment().amount;
        return total === 0 ? 0 : (this.totalByCategory(category).amount / total) * 100;
    }

    /** @returns {number} Actual yield if there is one, otherwise the expected one. */
    referenceYield() {
        return this.actualYield ?? this.expectedYield;
    }

    /** @returns {Money} Total investment / yield. */
    breakevenPrice() {
        return this.breakevenPriceFor(this.referenceYield());
    }

    /**
     * Same as breakevenPrice, but with the yield we pass.
     * @param {number} yieldQuantity - Yield.
     * @returns {Money} Breakeven price.
     */
    breakevenPriceFor(yieldQuantity) {
        return yieldQuantity > 0
            ? this.totalInvestment().multiply(1 / yieldQuantity)
            : new Money(0, this.currency);
    }

    /**
     * Breakeven price + margin (%), rounded up.
     * @param {number} [marginPercentage=0] - Profit margin.
     * @returns {Money} Suggested price.
     */
    suggestedPrice(marginPercentage = 0) {
        return new Money(Math.ceil(this.breakevenPrice().amount * (1 + marginPercentage / 100)), this.currency);
    }

    /**
     * Without a category it uses the total investment.
     * @param {number} areaHectares - Area of the plot.
     * @param {string} [category] - Expense category.
     * @returns {Money} Cost per hectare.
     */
    costPerHectare(areaHectares, category) {
        if (areaHectares <= 0) return new Money(0, this.currency);
        const total = category ? this.totalByCategory(category) : this.totalInvestment();
        return total.multiply(1 / areaHectares);
    }

    /**
     * @param {number} areaHectares - Area of the plot.
     * @returns {number} Yield per hectare.
     */
    yieldPerHectare(areaHectares) {
        return areaHectares <= 0 ? 0 : this.referenceYield() / areaHectares;
    }
}

/**
 * Adds the totals of some expenses. It is not a `#private` method because the
 * stores keep the ledger in a reactive proxy, which cannot reach private members.
 * @param {import('./expense-entry.entity.js').ExpenseEntry[]} entries - Expenses.
 * @param {string} currency - Currency of the ledger.
 * @returns {Money} Sum of the expenses.
 */
function sumOf(entries, currency) {
    return entries.reduce((sum, entry) => sum.add(entry.total()), new Money(0, currency));
}
