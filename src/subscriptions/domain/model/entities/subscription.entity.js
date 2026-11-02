import {BillingCycle} from "./billing-cycle.js";
import {SubscriptionStatus} from "./subscription-status.js";

/**
 * @param {Date} date - Any moment of a day.
 * @returns {Date} Midnight of the given day, so dates are compared by calendar day.
 */
function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Adds one billing cycle to a date, keeping the day inside the target month.
 * @param {Date} start - Start of the period.
 * @param {string} cycle - Billing cycle.
 * @returns {Date} End of the period.
 */
function addCycle(start, cycle) {
    const months = cycle === BillingCycle.ANNUAL ? 12 : 1;
    const lastDay = new Date(start.getFullYear(), start.getMonth() + months + 1, 0).getDate();
    return new Date(start.getFullYear(), start.getMonth() + months, Math.min(start.getDate(), lastDay));
}

/**
 * Plan of one user, with its state, billing cycle and validity.
 * It only stores the `planId`; the store fills `plan` after loading the catalog.
 *
 * @class Subscription
 */
export class Subscription {
    /**
     * @param {Object} props - Entity attributes.
     * @param {number} props.id - Subscription identifier.
     * @param {number} props.userId - Owner of the subscription.
     * @param {number} props.planId - Plan of the subscription.
     * @param {?import('./plan.entity.js').Plan} [props.plan=null] - Plan, completed by the store.
     * @param {string} props.status - State (`SubscriptionStatus`).
     * @param {string} props.billingCycle - Billing cycle (`BillingCycle`).
     * @param {Date} props.startDate - Start of the current period.
     * @param {?Date} [props.endDate=null] - End of the current period.
     * @param {boolean} props.autoRenew - `true` while the plan renews by itself.
     */
    constructor({ id, userId, planId, plan, status, billingCycle, startDate, endDate, autoRenew }) {
        this.id = id;
        this.userId = userId;
        this.planId = planId;
        this._plan = plan ?? null;
        this.status = status;
        this.billingCycle = billingCycle;
        this.startDate = startDate;
        this.endDate = endDate ?? null;
        this.autoRenew = autoRenew;
    }

    /**
     * New subscription after the first approved payment. The server assigns the id.
     * @param {{userId: number, plan: import('./plan.entity.js').Plan, billingCycle: string, startDate: Date}} props - First period.
     * @returns {Subscription} New subscription.
     */
    static start({ userId, plan, billingCycle, startDate }) {
        const subscription = new Subscription({
            id: 0,
            userId,
            planId: plan.id,
            plan,
            status: SubscriptionStatus.ACTIVE,
            billingCycle,
            startDate: startOfDay(startDate),
            endDate: null,
            autoRenew: true
        });
        subscription.changePlan(plan, billingCycle, startDate);
        return subscription;
    }

    /** @returns {?import('./plan.entity.js').Plan} Plan of the subscription, or `null` until the store completes it. */
    get plan() {
        return this._plan;
    }

    /** @param {?import('./plan.entity.js').Plan} value - Plan of the subscription. */
    set plan(value) {
        this._plan = value;
        if (value) this.planId = value.id;
    }

    /** @returns {boolean} `true` while the subscription is not cancelled. */
    isActive() {
        return this.status === SubscriptionStatus.ACTIVE;
    }

    /**
     * @param {Date} [today=new Date()] - Current date.
     * @returns {boolean} `true` when the user can still use the plan: active, or cancelled but not yet expired.
     */
    hasAccess(today = new Date()) {
        if (this.isActive()) return true;
        return this.endDate !== null && this.endDate >= startOfDay(today);
    }

    /**
     * @param {Date} [today=new Date()] - Current date.
     * @returns {boolean} `true` when a cancelled plan reached its end date, so the user is left without plan.
     */
    isExpired(today = new Date()) {
        return this.status === SubscriptionStatus.CANCELLED && this.endDate !== null && this.endDate < startOfDay(today);
    }

    /**
     * @param {number} registeredPlots - Plots already registered.
     * @returns {number} Plots still available under the quota of the plan.
     */
    remainingPlotSlots(registeredPlots) {
        return Math.max(0, (this._plan?.plotQuota ?? 0) - registeredPlots);
    }

    /**
     * @param {number} registeredPlots - Plots already registered.
     * @returns {boolean} `true` when one more plot fits in the quota.
     */
    canRegisterPlot(registeredPlots) {
        return this._plan !== null && registeredPlots < this._plan.plotQuota;
    }

    /**
     * Moves to another plan and starts a new period (policy P2 after a paid charge).
     * @param {import('./plan.entity.js').Plan} plan - New plan.
     * @param {string} cycle - Billing cycle.
     * @param {Date} startDate - Start of the new period.
     */
    changePlan(plan, cycle, startDate) {
        this.plan = plan;
        this.status = SubscriptionStatus.ACTIVE;
        this.billingCycle = cycle;
        this.startDate = startOfDay(startDate);
        this.endDate = addCycle(this.startDate, cycle);
        this.autoRenew = true;
    }

    /**
     * Stops the renewal; the user keeps the access until the end date.
     * @throws {Error} When the subscription is already cancelled.
     */
    cancel() {
        if (this.status === SubscriptionStatus.CANCELLED) throw new Error('The subscription is already cancelled.');
        this.status = SubscriptionStatus.CANCELLED;
        this.autoRenew = false;
        this.endDate ??= addCycle(this.startDate, this.billingCycle);
    }

    /** @returns {Subscription} Independent copy, so a change is applied before it is confirmed by the API. */
    copy() {
        return new Subscription({
            id: this.id,
            userId: this.userId,
            planId: this.planId,
            plan: this._plan,
            status: this.status,
            billingCycle: this.billingCycle,
            startDate: this.startDate,
            endDate: this.endDate,
            autoRenew: this.autoRenew
        });
    }
}
