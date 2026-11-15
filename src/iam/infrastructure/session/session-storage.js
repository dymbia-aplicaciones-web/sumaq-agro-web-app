import {AuthenticatedUser} from '../../domain/model/entities/authenticated-user.entity.js';
import {mockAuthentication} from '../mock/development-authentication.js';

const key = 'sumaq-agro.iam.mock-session.v1';
export const duration = 30 * 60 * 1000;

export function clearSession() {
    if (!mockAuthentication) return;
    try { sessionStorage.removeItem(key); } catch { /* Storage can be disabled. */ }
}

export function saveSession(user) {
    if (!mockAuthentication || !user.token.startsWith('mock-session-')) return null;
    const issuedAt = Date.now();
    const expiresAt = issuedAt + duration;
    try {
        sessionStorage.setItem(key, JSON.stringify({version: 1, issuedAt, expiresAt, user}));
    } catch { /* The in-memory session still expires. */ }
    return expiresAt;
}

export function restoreSession() {
    if (!mockAuthentication) return null;
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const {version, issuedAt, expiresAt, user} = JSON.parse(raw);
        if (version !== 1 || !Number.isSafeInteger(issuedAt) || issuedAt > Date.now() ||
            expiresAt !== issuedAt + duration || expiresAt <= Date.now() ||
            typeof user?.email !== 'string' || !user.email.trim() ||
            !user.token?.startsWith('mock-session-')) throw new Error('Invalid development session');
        return {user: new AuthenticatedUser(user), expiresAt};
    } catch {
        clearSession();
        return null;
    }
}
