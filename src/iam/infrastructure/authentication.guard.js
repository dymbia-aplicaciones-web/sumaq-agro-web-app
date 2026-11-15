import useIamStore from '../application/iam.store.js';

export function authenticationGuard(to) {
    const store = useIamStore();
    if (to.meta.public === true || to.name === 'public-traceability') return true;
    if (!store.isSignedIn) return {name: 'iam-sign-in', query: {returnUrl: to.fullPath}};
    if (to.meta.roles && !store.hasRole(...to.meta.roles))
        return {name: 'forbidden', query: {from: to.fullPath}};
    return true;
}
