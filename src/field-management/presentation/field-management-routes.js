// Lazy-loaded components
const myPlotDashboard = () => import('./views/my-plot-dashboard.vue');
const registeredPlots = () => import('./views/registered-plots.vue');
const plotRegistration = () => import('./views/plot-registration.vue');
const plotBoundaryDelineation = () => import('./views/plot-boundary-delineation.vue');
const plotDetail = () => import('./views/plot-detail.vue');
const soilBaseline = () => import('./views/soil-baseline.vue');
const campaignHistory = () => import('./views/campaign-history.vue');
const campaignStart = () => import('./views/campaign-start.vue');
const campaignFinances = () => import('./views/campaign-finances.vue');
const costReports = () => import('./views/cost-reports.vue');
const fieldExpense = () => import('./views/field-expense.vue');

/**
 * Routes of Field Management (under `/field-management`), same paths as the
 * Angular `field-management.routes.ts`. One route per expense type;
 * `meta.category` tells the form which one.
 */
const fieldManagementRoutes = [
    {   path: '',                               redirect: { name: 'field-management-dashboard' } },
    {   path: 'dashboard',                      name: 'field-management-dashboard',         component: myPlotDashboard,         meta: { title: 'routes.fm-dashboard' } },
    {   path: 'plots',                          name: 'field-management-plots',             component: registeredPlots,         meta: { title: 'routes.fm-plots' } },
    {   path: 'plots/new',                      name: 'field-management-plot-new',          component: plotRegistration,        meta: { title: 'routes.fm-plot-new' } },
    {   path: 'plots/:id/boundary',             name: 'field-management-plot-boundary',     component: plotBoundaryDelineation, meta: { title: 'routes.fm-plot-boundary' } },
    {   path: 'plots/:id',                      name: 'field-management-plot-detail',       component: plotDetail,              meta: { title: 'routes.fm-plot-detail' } },
    {   path: 'plots/:id/soil',                 name: 'field-management-plot-soil',         component: soilBaseline,            meta: { title: 'routes.fm-plot-soil' } },
    {   path: 'campaigns',                      name: 'field-management-campaigns',         component: campaignHistory,         meta: { title: 'routes.fm-campaigns' } },
    {   path: 'campaigns/new',                  name: 'field-management-campaign-new',      component: campaignStart,           meta: { title: 'routes.fm-campaign-new' } },
    {   path: 'finances',                       name: 'field-management-finances',          component: campaignFinances,        meta: { title: 'routes.fm-finances' } },
    {   path: 'finances/reports',               name: 'field-management-reports',           component: costReports,             meta: { title: 'routes.fm-reports' } },
    {   path: 'finances/expenses/new/inputs',   name: 'field-management-expense-inputs',    component: fieldExpense,            meta: { title: 'routes.fm-expense-inputs', category: 'INPUTS' } },
    {   path: 'finances/expenses/new/labor',    name: 'field-management-expense-labor',     component: fieldExpense,            meta: { title: 'routes.fm-expense-labor', category: 'LABOR' } },
    {   path: 'finances/expenses/new/freight',  name: 'field-management-expense-freight',   component: fieldExpense,            meta: { title: 'routes.fm-expense-freight', category: 'FREIGHT' } },
    {   path: 'finances/expenses/new',          redirect: { name: 'field-management-expense-inputs' } }
];

export default fieldManagementRoutes;
