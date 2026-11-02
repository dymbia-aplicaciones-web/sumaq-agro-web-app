import {createRouter, createWebHistory} from "vue-router";
import i18n from "./i18n.js";
import iamRoutes from "./iam/presentation/iam-routes.js";
import fieldManagementRoutes from "./field-management/presentation/field-management-routes.js";
import cropHealthRoutes from "./crop-health/presentation/crop-health-routes.js";
import profilesRoutes from "./profiles/presentation/profiles-routes.js";
import harvestCertificationRoutes, {publicTraceabilityRoutes} from "./harvest-certification/presentation/harvest-certification-routes.js";
import subscriptionsRoutes from "./subscriptions/presentation/subscriptions-routes.js";
import {authenticationGuard} from "./iam/infrastructure/authentication.guard.js";

// Define lazy-loaded components for routes
const layout = () => import('./shared/presentation/components/layout.vue');
const pageNotFound = () => import('./shared/presentation/views/page-not-found.vue');
const forbidden = () => import('./shared/presentation/views/forbidden.vue');

/**
 * Root routes (Angular `app.routes.ts`).
 * The demo access and the public QR verification are shown without the shell;
 * the private pages are children of the layout (side menu and top bar).
 */
const routes = [
    { path: '/iam',             children: iamRoutes },
    { path: '/verify',          children: publicTraceabilityRoutes },
    { path: '/demo-access',     redirect: { name: 'iam-demo-access' } },
    {
        path: '/',
        component: layout,
        children: [
            { path: '',                       name: 'home',                   redirect: { name: 'iam-demo-access' } },
            { path: 'field-management',       children: fieldManagementRoutes },
            { path: 'crop-health',            children: cropHealthRoutes },
            { path: 'profiles',               children: profilesRoutes },
            { path: 'harvest-certification',  children: harvestCertificationRoutes },
            { path: 'subscriptions',          children: subscriptionsRoutes },
            { path: 'forbidden',              name: 'forbidden',              component: forbidden,    meta: { title: 'routes.forbidden' } },
            { path: ':pathMatch(.*)*',        name: 'not-found',              component: pageNotFound, meta: { title: 'routes.not-found' } }
        ]
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: routes,
    scrollBehavior: () => ({ top: 0 })
});

/**
 * Global navigation guard that updates the document title and delegates the demo access control.
 *
 * @param {import('vue-router').RouteLocationNormalized} to - Target route.
 * @param {import('vue-router').RouteLocationNormalized} from - Previous route.
 * @returns {{name: string}|boolean|undefined} - Returns true to allow navigation or an object to redirect.
 */
router.beforeEach((to, from) => {
    console.log(`Navigating from ${String(from.name)} to ${String(to.name)}`);
    return authenticationGuard(to, from);
});

/**
 * Sets the page title from `meta.title` (an i18n key) in the active language.
 */
router.afterEach((to) => {
    let baseTitle = 'SumaqAgro';
    const title = to.meta['title'];
    document.title = title ? `${i18n.global.t(title)} – ${baseTitle}` : baseTitle;
});

export default router;
