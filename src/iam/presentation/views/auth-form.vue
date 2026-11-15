<script setup>
import {computed, reactive, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute, useRouter} from 'vue-router';
import useIamStore from '../../application/iam.store.js';
import {UserRole} from '../../domain/model/user.entity.js';

const props = defineProps({mode: {type: String, required: true}});
const {t} = useI18n();
const route = useRoute();
const router = useRouter();
const iam = useIamStore();
const fields = reactive({email: '', password: '', confirmation: '', firstName: '', lastName: '', role: null});
const busy = ref(false);
const completed = ref(false);
const error = ref('');
const recovery = computed(() => ['forgot', 'reset'].includes(props.mode));
const key = computed(() => recovery.value ? 'iam.recovery.' + props.mode : 'iam.' + props.mode);
const token = computed(() => typeof route.query.token === 'string' ? route.query.token.trim() : '');
const roles = computed(() => Object.values(UserRole).map(value => ({value, label: t('iam.roles.' + value)})));
let revision = 0;

watch([() => props.mode, token], () => {
    revision++;
    Object.assign(fields, {email: '', password: '', confirmation: '', firstName: '', lastName: '', role: null});
    busy.value = false;
    completed.value = false;
    error.value = '';
});

function validate(mode) {
    if (mode !== 'reset' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()))
        return 'iam.validation.email';
    if (mode === 'forgot') return '';
    if (!fields.password) return 'iam.validation.required';
    if (mode === 'signIn') return '';
    if (fields.password.length < 8) return 'iam.validation.passwordLength';
    if (fields.password !== fields.confirmation) return 'iam.validation.passwordMismatch';
    if (mode === 'signUp') {
        if (!fields.firstName.trim() || !fields.lastName.trim() || !fields.role) return 'iam.validation.required';
        if (fields.firstName.length > 100 || fields.lastName.length > 100) return 'iam.validation.nameLength';
    }
    return '';
}

function errorKey(cause, mode) {
    const status = cause.response?.status;
    if (recovery.value) {
        if (status === 429) return 'iam.recovery.errors.RATE_LIMITED';
        if (mode === 'reset' && [400, 404, 410].includes(status)) return 'iam.recovery.errors.INVALID_LINK';
        if (status === 400 || status === 422) return 'iam.recovery.errors.REQUEST_REJECTED';
        return 'iam.recovery.errors.' + (cause.request && !status ? 'CONNECTION_ERROR' : 'UNEXPECTED_ERROR');
    }
    if (mode === 'signIn' && [400, 401].includes(status)) return 'iam.errors.INVALID_CREDENTIALS';
    if (mode === 'signUp' && status === 409) return 'iam.errors.REGISTRATION_CONFLICT';
    if (status === 403) return 'iam.errors.ACCESS_DENIED';
    return 'iam.errors.' + (cause.request && !status ? 'CONNECTION_ERROR' : 'UNEXPECTED_ERROR');
}

async function submit() {
    const mode = props.mode;
    if (busy.value || completed.value || (mode === 'reset' && !token.value)) return;
    error.value = validate(mode);
    if (error.value) return;
    const request = ++revision;
    busy.value = true;
    const email = fields.email.trim();
    try {
        if (mode === 'signIn') {
            const user = await iam.signIn({email, password: fields.password});
            if (!user || request !== revision) return;
            const target = route.query.returnUrl;
            const resolved = typeof target === 'string' && /^\/(?![/\\])/.test(target) ? router.resolve(target) : null;
            const allowed = resolved && resolved.name !== 'not-found' && !resolved.meta.public &&
                resolved.name !== 'public-traceability' && (!resolved.meta.roles || user.hasRole(...resolved.meta.roles));
            await router.replace(allowed ? resolved.fullPath : user.initialRoute);
        } else if (mode === 'signUp') {
            await iam.signUp({...fields, email, firstName: fields.firstName.trim(), lastName: fields.lastName.trim()});
        } else if (mode === 'forgot') {
            await iam.requestPasswordReset(email);
        } else {
            await iam.resetPassword(token.value, fields.password);
        }
        if (request === revision) completed.value = true;
    } catch (cause) {
        if (request === revision) error.value = errorKey(cause, mode);
    } finally {
        if (request === revision) busy.value = false;
    }
}
</script>

<template>
  <main class="min-h-screen flex align-items-center justify-content-center p-4">
    <pv-card style="width: min(100%, 32rem)">
      <template #title>{{ t(key + '.title') }}</template>
      <template #subtitle>{{ t(key + '.subtitle') }}</template>
      <template #content>
        <pv-message v-if="mode === 'reset' && !token" severity="error">{{ t('iam.recovery.errors.INVALID_LINK') }}</pv-message>
        <pv-message v-else-if="completed" severity="success">
          {{ t(key + (mode === 'signIn' ? '.success' : '.successMessage')) }}
        </pv-message>
        <form v-else class="flex flex-column gap-2" novalidate @submit.prevent="submit">
          <template v-if="mode === 'signUp'">
            <label for="iam-role">{{ t('iam.signUp.roleLabel') }}</label>
            <pv-select v-model="fields.role" input-id="iam-role" :options="roles" option-label="label" option-value="value"/>
            <label for="iam-first-name">{{ t('iam.fields.firstName') }}</label>
            <pv-input-text id="iam-first-name" v-model="fields.firstName" autocomplete="given-name" maxlength="100"/>
            <label for="iam-last-name">{{ t('iam.fields.lastName') }}</label>
            <pv-input-text id="iam-last-name" v-model="fields.lastName" autocomplete="family-name" maxlength="100"/>
          </template>
          <template v-if="mode !== 'reset'">
            <label for="iam-email">{{ t('iam.fields.email') }}</label>
            <pv-input-text id="iam-email" v-model="fields.email" type="email" autocomplete="email"/>
          </template>
          <template v-if="mode !== 'forgot'">
            <label for="iam-password">{{ t(mode === 'reset' ? 'iam.recovery.reset.newPassword' : 'iam.fields.password') }}</label>
            <pv-input-text id="iam-password" v-model="fields.password" type="password"
                           :autocomplete="mode === 'signIn' ? 'current-password' : 'new-password'"/>
            <template v-if="mode !== 'signIn'">
              <label for="iam-confirmation">{{ t('iam.fields.confirmPassword') }}</label>
              <pv-input-text id="iam-confirmation" v-model="fields.confirmation" type="password" autocomplete="new-password"/>
            </template>
          </template>
          <pv-message v-if="error" severity="error">{{ t(error) }}</pv-message>
          <pv-button type="submit" :loading="busy" :label="t(key + '.submit')"/>
        </form>
        <div class="flex flex-wrap gap-3 mt-3">
          <template v-if="mode === 'signIn'">
            <router-link :to="{name: 'iam-sign-up'}">{{ t('iam.signIn.register') }}</router-link>
            <router-link :to="{name: 'iam-forgot-password'}">{{ t('iam.recovery.forgotLink') }}</router-link>
          </template>
          <router-link v-else :to="{name: 'iam-sign-in'}">{{ t('iam.recovery.backToSignIn') }}</router-link>
          <router-link v-if="mode === 'reset' && !completed" :to="{name: 'iam-forgot-password'}">{{ t('iam.recovery.requestNewLink') }}</router-link>
        </div>
      </template>
    </pv-card>
  </main>
</template>
