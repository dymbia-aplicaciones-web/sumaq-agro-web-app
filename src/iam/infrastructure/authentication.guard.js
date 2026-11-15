import {canOpenWorkspace} from './workspace-access.js';
import useIamStore from '../application/iam.store.js';

export function authenticationGuard(to) {
    const store = useIamStore();
    if (to.meta.public === true || to.name === 'public-traceability') return true;
    store.checkExpiration();
    if (!store.isSignedIn) return {name: 'iam-sign-in', query: {returnUrl: to.fullPath}};
    if (!canOpenWorkspace(store.currentRole, to.path) ||
        (to.meta.roles && !to.meta.roles.includes(store.currentRole))) return store.currentUser.initialRoute;
    return true;
}
