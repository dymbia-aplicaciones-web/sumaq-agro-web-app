/**
 * Chooses a plan and a billing cycle to go to the payment.
 *
 * @class SelectSubscriptionPlanCommand
 */
export class SelectSubscriptionPlanCommand {
    /**
     * @param {Object} props - Command data.
     * @param {number} props.userId - User who chooses the plan.
     * @param {string} props.planCode - Plan chosen (`PlanCode`).
     * @param {string} props.billingCycle - Billing cycle chosen (`BillingCycle`).
     */
    constructor({ userId, planCode, billingCycle }) {
        this.userId = userId;
        this.planCode = planCode;
        this.billingCycle = billingCycle;
    }
}
