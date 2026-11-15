import {watch} from "vue";
import useIamStore from "./iam/application/iam.store.js";
import {createRouter, createWebHistory} from "vue-router";
import i18n from "./i18n.js";
import iamRoutes from "./iam/presentation/iam-routes.js";
import fieldManagementRoutes from "./field-management/presentation/field-management-routes.js";
import cropHealthRoutes from "./crop-health/presentation/crop-health-routes.js";
import profilesRoutes from "./profiles/presentation/profiles-routes.js";
import harvestCertificationRoutes, {publicTraceabilityRoutes} from "./harvest-certification/presentation/harvest-certification-routes.js";
import subscriptionsRoutes from "./subscriptions/presentation/subscriptions-routes.js";
import {activeSubscriptionGuard} from "./subscriptions/infrastructure/active-subscription.guard.js";
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
    ...iamRoutes,
    { path: '/iam/demo-access', redirect: { name: 'iam-sign-in' } },
    { path: '/subscriptions',   children: subscriptionsRoutes },
    { path: '/verify',          children: publicTraceabilityRoutes },
    { path: '/demo-access',     redirect: { name: 'iam-sign-in' } },
    {
        path: '/',
        component: layout,
        children: [
            { path: '',                       name: 'home',                   redirect: () => useIamStore().currentUser?.initialRoute ?? { name: 'iam-sign-in' } },
            { path: 'field-management',       children: fieldManagementRoutes, meta: { requiresActiveSubscription: true } },
            { path: 'crop-health',            children: cropHealthRoutes, meta: { requiresActiveSubscription: true } },
            { path: 'profiles',               children: profilesRoutes, meta: { requiresActiveSubscription: true } },
            { path: 'harvest-certification',  children: harvestCertificationRoutes, meta: { requiresActiveSubscription: true } },
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
let watchingSession = false;
router.beforeEach(to => {
    if (!watchingSession) {
        watchingSession = true;
        const iam = useIamStore();
        watch(() => iam.isSignedIn, signedIn => {
            const current = router.currentRoute.value;
            if (!signedIn && !current.meta.public && current.name !== 'public-traceability')
                void router.replace({name: 'iam-sign-in', query: {returnUrl: current.fullPath}});
        });
    }
    const authentication = authenticationGuard(to);
    return authentication === true ? activeSubscriptionGuard(to) : authentication;
});

/**
 * Sets the page title from `meta.title` (an i18n key) in the active language.
 */
const routeRecoveryKey = 'sumaqagro.route-recovery';

router.onError((error, to) => {
    const failedImport = /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|unable to preload css/i.test(error.message);
    if (!failedImport || !navigator.onLine || sessionStorage.getItem(routeRecoveryKey) === to.fullPath) return;

    sessionStorage.setItem(routeRecoveryKey, to.fullPath);
    window.location.replace(router.resolve(to.fullPath).href);
});

router.afterEach((to, _, failure) => {
    if (!failure && sessionStorage.getItem(routeRecoveryKey) === to.fullPath)
        sessionStorage.removeItem(routeRecoveryKey);
    let baseTitle = 'SumaqAgro';
    const title = to.meta['title'];
    document.title = title ? `${i18n.global.t(title)} – ${baseTitle}` : baseTitle;
});

export default router;
