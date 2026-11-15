import {clearSession, restoreSession, saveSession} from '../infrastructure/session/session-storage.js';
import {defineStore} from 'pinia';
import {computed, shallowRef} from 'vue';
import {configureIamInterceptor} from '../infrastructure/iam.interceptor.js';
import {IamApi} from '../infrastructure/iam-api.js';

export default defineStore('iam', () => {
    const restored = restoreSession();
    const currentUser = shallowRef(restored?.user ?? null);
    let expiresAt = restored?.expiresAt ?? null;
    let timer;

    function checkExpiration() {
        if (expiresAt !== null && Date.now() >= expiresAt) signOut();
    }

    function scheduleExpiration() {
        clearTimeout(timer);
        if (expiresAt !== null) timer = setTimeout(checkExpiration, Math.max(0, expiresAt - Date.now()));
    }

    scheduleExpiration();
    const currentUserId = computed(() => currentUser.value?.id ?? null);
    const currentRole = computed(() => currentUser.value?.experience ?? null);
    const isSignedIn = computed(() => currentUser.value !== null);
    const api = new IamApi();
    let revision = 0;

    async function signIn(credentials) {
        const request = ++revision;
        const user = await api.signIn(credentials);
        if (request !== revision) return null;
        expiresAt = saveSession(user);
        scheduleExpiration();
        currentUser.value = user;
        return user;
    }

    function signOut(router) {
        revision++;
        expiresAt = null;
        clearTimeout(timer);
        clearSession();
        currentUser.value = null;
        if (router) router.push({name: 'iam-sign-in'});
    }

    function hasRole(...roles) {
        return currentUser.value?.hasRole(...roles) ?? false;
    }

    configureIamInterceptor(() => {
        checkExpiration();
        return currentUser.value;
    }, signOut);

    return {
        currentUser, currentUserId, currentRole, isSignedIn, signIn, signOut, hasRole, checkExpiration,
        signUp: command => api.signUp(command),
        requestPasswordReset: email => api.requestPasswordReset(email),
        resetPassword: (token, password) => api.resetPassword(token, password)
    };
});
