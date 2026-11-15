import {PlanCode} from './plan-code.js';

export const SubscriptionSegment = Object.freeze({
    INDEPENDENT_FARMER: 'INDEPENDENT_FARMER',
    COOPERATIVE: 'COOPERATIVE',
    TECHNICAL_ADVISOR: 'TECHNICAL_ADVISOR'
});

const segmentByRole = {
    FARMER: SubscriptionSegment.INDEPENDENT_FARMER,
    COOPERATIVE_DIRECTOR: SubscriptionSegment.COOPERATIVE,
    AGRONOMIST: SubscriptionSegment.TECHNICAL_ADVISOR
};

const planBySegment = {
    [SubscriptionSegment.INDEPENDENT_FARMER]: PlanCode.SEED,
    [SubscriptionSegment.COOPERATIVE]: PlanCode.COOPERATIVE_PRO,
    [SubscriptionSegment.TECHNICAL_ADVISOR]: PlanCode.TECHNICAL_ADVISOR
};

export function planForRole(role) {
    return planBySegment[segmentByRole[role]] ?? null;
}
