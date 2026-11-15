import useIamStore from '../../iam/application/iam.store.js';
import {SubscriptionsApi} from './subscriptions-api.js';

const api = new SubscriptionsApi();

export async function activeSubscriptionGuard(to) {
    if (!to.meta.requiresActiveSubscription) return true;
    const iam = useIamStore();
    const user = iam.currentUser;
    const signIn = { name: 'iam-sign-in', query: { returnUrl: to.fullPath } };
    if (!user) return signIn;

    try {
        const subscription = await api.getSubscriptionByUserId(user.id);
        if (iam.currentUser !== user) return signIn;
        return subscription?.hasAccess() === true || { name: 'subscriptions-plans' };
    } catch {
        if (iam.currentUser !== user) return signIn;
        return { name: 'subscriptions-plans', query: { accessCheck: 'failed' } };
    }
}
