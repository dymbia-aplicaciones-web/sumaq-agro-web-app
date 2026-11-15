import {defineStore} from 'pinia';
import {computed, shallowRef} from 'vue';
import {configureIamInterceptor} from '../infrastructure/iam.interceptor.js';
import {IamApi} from '../infrastructure/iam-api.js';

export default defineStore('iam', () => {
    const currentUser = shallowRef(null);
    const currentUserId = computed(() => currentUser.value?.id ?? null);
    const currentRole = computed(() => currentUser.value?.experience ?? null);
    const isSignedIn = computed(() => currentUser.value !== null);
    const api = new IamApi();
    let revision = 0;

    async function signIn(credentials) {
        const request = ++revision;
        const user = await api.signIn(credentials);
        if (request !== revision) return null;
        currentUser.value = user;
        return user;
    }

    function signOut(router) {
        revision++;
        currentUser.value = null;
        if (router) router.push({name: 'iam-sign-in'});
    }

    function hasRole(...roles) {
        return currentUser.value?.hasRole(...roles) ?? false;
    }

    configureIamInterceptor(() => currentUser.value, signOut);

    return {
        currentUser, currentUserId, currentRole, isSignedIn, signIn, signOut, hasRole,
        signUp: command => api.signUp(command),
        requestPasswordReset: email => api.requestPasswordReset(email),
        resetPassword: (token, password) => api.resetPassword(token, password)
    };
});
