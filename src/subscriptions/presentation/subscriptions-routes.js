// Lazy-loaded components
const plansCatalog = () => import('./views/plans-catalog.vue');
const checkout = () => import('./views/checkout.vue');
const billingHistory = () => import('./views/billing-history.vue');

/**
 * Routes of Subscriptions and Payments (under `/subscriptions`), same paths as
 * the Angular `subscriptions.routes.ts`.
 */
const subscriptionsRoutes = [
    {   path: 'plans',      name: 'subscriptions-plans',      component: plansCatalog,    meta: { title: 'routes.subscriptions-plans' } },
    {   path: 'checkout',   name: 'subscriptions-checkout',   component: checkout,        meta: { title: 'routes.subscriptions-checkout' } },
    {   path: 'billing',    name: 'subscriptions-billing',    component: billingHistory,  meta: { title: 'routes.subscriptions-billing' } },
    {   path: '',           redirect: { name: 'subscriptions-plans' } }
];

export default subscriptionsRoutes;
