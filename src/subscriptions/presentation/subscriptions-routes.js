// Lazy-loaded components
const plansCatalog = () => import('./views/plans-catalog.vue');
const checkout = () => import('./views/checkout.vue');
const billingHistory = () => import('./views/billing-history.vue');

/**
 * Routes of Subscriptions and Payments (under `/subscriptions`), same paths as
 * the Angular `subscriptions.routes.ts`.
 */
const subscriptionsShell = () => import('./components/subscriptions-shell.vue');
const layout = () => import('../../shared/presentation/components/layout.vue');

const subscriptionsRoutes = [
    { path: 'billing', redirect: { name: 'subscriptions-billing' } },
    {
        path: '',
        component: layout,
        children: [
            { path: '', name: 'subscriptions-billing', component: billingHistory, meta: { title: 'routes.subscriptions-billing' } }
        ]
    },
    {
        path: '',
        component: subscriptionsShell,
        children: [
            { path: 'plans', name: 'subscriptions-plans', component: plansCatalog, meta: { title: 'routes.subscriptions-plans' } },
            { path: 'checkout', name: 'subscriptions-checkout', component: checkout, meta: { title: 'routes.subscriptions-checkout' } }
        ]
    }
];

export default subscriptionsRoutes;
