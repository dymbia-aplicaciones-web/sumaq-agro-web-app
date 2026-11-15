// Lazy-loaded components
const harvestCertificates = () => import('./views/harvest-certificates.vue');
const publicTraceability = () => import('./views/public-traceability.vue');

/** Private routes (under `/harvest-certification`), as in `harvest-certification.routes.ts`. */
const harvestCertificationRoutes = [
    {   path: '',               redirect: { name: 'harvest-certification-certificates' } },
    {   path: 'certificates',   name: 'harvest-certification-certificates',  component: harvestCertificates, meta: { title: 'harvest-certification.page-title', roles: ['FARMER', 'COOPERATIVE_DIRECTOR'] } }
];

/** Public QR verification (under `/verify`), shown without the shell or a session. */
export const publicTraceabilityRoutes = [
    {   path: ':token?',         name: 'public-traceability',                 component: publicTraceability,  meta: { title: 'routes.public-traceability' } }
];

export default harvestCertificationRoutes;
