import {Money} from "../../../../shared/domain/model/money.js";
import {BillingCycle} from "./billing-cycle.js";

/**
 * Plan of the catalog with its prices and plot quota.
 *
 * @class Plan
 */
export class Plan {
    /**
     * @param {Object} props - Entity attributes.
     * @param {number} props.id - Plan identifier.
     * @param {string} props.code - Code of the plan (`PlanCode`).
     * @param {string} props.name - Name of the plan.
     * @param {Money} props.monthlyPrice - Price of one month.
     * @param {Money} props.annualPrice - Price of one year.
     * @param {number} props.plotQuota - Plots the producer can register with this plan.
     * @param {string[]} [props.features=[]] - Features (i18n keys under `subscriptions.features`).
     */
    constructor({ id, code, name, monthlyPrice, annualPrice, plotQuota, features }) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.monthlyPrice = monthlyPrice;
        this.annualPrice = annualPrice;
        this.plotQuota = plotQuota;
        this.features = features ?? [];
    }

    /**
     * @param {string} cycle - Billing cycle.
     * @returns {Money} Price charged for one billing cycle.
     */
    priceFor(cycle) {
        return cycle === BillingCycle.ANNUAL ? this.annualPrice : this.monthlyPrice;
    }

    /** @returns {Money} Money saved by paying the year at once instead of twelve months. */
    annualSavings() {
        const savings = this.monthlyPrice.amount * 12 - this.annualPrice.amount;
        return new Money(Math.max(0, savings), this.monthlyPrice.currency);
    }
}
