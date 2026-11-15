const publicAuthentication = new Set([
    '/tokens', '/users', '/public/traceability',
    '/authentication/sign-in', '/authentication/sign-up',
    '/authentication/password-recovery', '/authentication/password-recovery/request',
    '/authentication/password-recovery/reset'
]);

let readSession = () => null;
let invalidateSession = () => {};

export function configureIamInterceptor(read, invalidate) {
    readSession = read;
    invalidateSession = invalidate;
}

export function installIamInterceptor(http) {
    const sessions = new WeakMap();
    http.interceptors.request.use(config => {
        const base = new URL(http.defaults.baseURL, window.location.origin);
        const target = new URL(http.getUri(config), window.location.origin);
        const root = base.pathname.replace(/\/+$/, '');
        if (base.origin !== target.origin || !target.pathname.startsWith(root + '/') ||
            publicAuthentication.has(target.pathname.slice(root.length)) ||
            config.headers.has('Authorization')) return config;
        const user = readSession();
        if (user) {
            config.headers.set('Authorization', `Bearer ${user.token}`);
            sessions.set(config, user);
        }
        return config;
    });
    http.interceptors.response.use(response => response, error => {
        const session = error.config && sessions.get(error.config);
        if (error.response?.status === 401 && session && readSession() === session)
            invalidateSession();
        return Promise.reject(error);
    });
}
