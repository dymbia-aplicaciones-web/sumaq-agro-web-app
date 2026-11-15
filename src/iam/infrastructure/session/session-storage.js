import {AuthenticatedUser} from '../../domain/model/entities/authenticated-user.entity.js';
import {mockAuthentication} from '../mock/development-authentication.js';

const key = 'sumaq-agro.iam.session.v1';
const demoDuration = 30 * 60 * 1000;

function tokenExpiration(token) {
    if (typeof token !== 'string') throw new Error('Missing session token');
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid session token');
    const payload = parts[1].replaceAll('-', '+').replaceAll('_', '/');
    const { exp } = JSON.parse(atob(payload));
    if (!Number.isSafeInteger(exp) || !Number.isSafeInteger(exp * 1000))
        throw new Error('Invalid session expiration');
    return exp * 1000;
}

export function clearSession() {
    try { sessionStorage.removeItem(key); } catch { /* Storage can be disabled. */ }
}

export function saveSession(user) {
    const expiresAt = mockAuthentication ? Date.now() + demoDuration : tokenExpiration(user.token);
    if (expiresAt <= Date.now()) throw new Error('The session has expired');
    try {
        sessionStorage.setItem(key, JSON.stringify({ user, expiresAt }));
    } catch { /* The in-memory session still expires. */ }
    return expiresAt;
}

export function restoreSession() {
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const { user, expiresAt } = JSON.parse(raw);
        const validToken = mockAuthentication ? user?.token?.startsWith('mock-session-')
            : tokenExpiration(user?.token) === expiresAt;
        if (!validToken || !Number.isSafeInteger(expiresAt) || expiresAt <= Date.now())
            throw new Error('Invalid or expired session');
        return { user: new AuthenticatedUser(user), expiresAt };
    } catch {
        clearSession();
        return null;
    }
}