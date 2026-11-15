// Lazy-loaded components
const farmerSettings = () => import('./views/farmer-settings.vue');
const cooperativeDashboard = () => import('./views/cooperative-dashboard.vue');
const cooperativeSettings = () => import('./views/cooperative-settings.vue');

const cooperativeRegistration = () => import('./views/cooperative-registration.vue');
const cooperativeMembers = () => import('./views/cooperative-members.vue');
const directorRoles = ['COOPERATIVE_DIRECTOR'];

/** Routes of Profiles (under `/profiles`), same paths as the Angular `profiles.routes.ts`. */
const profilesRoutes = [
    {   path: '',                       redirect: { name: 'profiles-cooperative-dashboard' } },
    {   path: 'settings',               name: 'profiles-settings',                  component: farmerSettings,       meta: { title: 'routes.pr-settings', roles: ['FARMER'] } },
    { path: 'cooperative/registration', name: 'profiles-cooperative-registration', component: cooperativeRegistration, meta: { title: 'profiles.cooperative.registration.title', roles: directorRoles } },
    { path: 'cooperative/members', name: 'profiles-cooperative-members', component: cooperativeMembers, meta: { title: 'profiles.cooperative.members.title', roles: directorRoles } },
    { path: 'cooperative/members/:id', name: 'profiles-cooperative-member', component: cooperativeMembers, meta: { title: 'profiles.cooperative.members.dossier', roles: directorRoles } },
    {   path: 'cooperative/dashboard',  name: 'profiles-cooperative-dashboard',     component: cooperativeDashboard, meta: { title: 'routes.pr-cooperative-dashboard', roles: directorRoles } },
    {   path: 'cooperative/settings',   name: 'profiles-cooperative-settings',      component: cooperativeSettings,  meta: { title: 'routes.pr-cooperative-settings', roles: directorRoles } }
];

export default profilesRoutes;
