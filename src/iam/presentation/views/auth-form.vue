<script setup>
import {computed, reactive, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute, useRouter} from 'vue-router';
import {developmentAccounts, mockAuthentication} from '../../infrastructure/mock/development-authentication.js';
import AuthLayout from "../components/auth-layout.vue";
import useIamStore from '../../application/iam.store.js';
import {UserRole} from '../../domain/model/user.entity.js';

const props = defineProps({mode: {type: String, required: true}});
const {t} = useI18n();
const route = useRoute();
const router = useRouter();
const iam = useIamStore();
function fillDevelopmentAccount(email) {
    fields.email = email;
    fields.password = 'SumaqAgroDemo2026!';
}

const fields = reactive({email: '', password: '', confirmation: '', firstName: '', lastName: '', role: null});
const busy = ref(false);
const completed = ref(false);
const showPassword = ref(false);
const error = ref('');
const recovery = computed(() => ['forgot', 'reset'].includes(props.mode));
const recoveryPreview = computed(() => mockAuthentication && recovery.value);
const key = computed(() => recovery.value ? 'iam.recovery.' + props.mode : 'iam.' + props.mode);
const token = computed(() => typeof route.query.token === 'string' ? route.query.token.trim() : '');
const roles = computed(() => Object.values(UserRole).map(value => ({value, label: t('iam.roles.' + value)})));
let revision = 0;

watch([() => props.mode, token], () => {
    revision++;
    Object.assign(fields, {email: '', password: '', confirmation: '', firstName: '', lastName: '', role: null});
    busy.value = false;
    completed.value = false;
    showPassword.value = false;
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
  <auth-layout :compact="mode === 'signUp'">
    <header class="auth-heading">
      <div v-if="!recovery" class="eyebrow">{{ t(key + '.eyebrow') }}</div>
      <h1>{{ t(key + '.title') }}</h1>
      <p>{{ t(key + '.subtitle') }}</p>
    </header>
    <pv-message v-if="recoveryPreview" severity="info">{{ t('iam.recovery.previewNotice') }}</pv-message>
        <pv-message v-if="mode === 'reset' && !token" severity="error">{{ t('iam.recovery.errors.INVALID_LINK') }}</pv-message>
        <pv-message v-else-if="completed" severity="success">
          {{ t(key + (recoveryPreview ? '.previewResult' : mode === 'signIn' ? '.success' : '.successMessage')) }}
        </pv-message>
        <form v-else class="auth-fields" novalidate @submit.prevent="submit">
          <template v-if="mode === 'signUp'">
            <label for="iam-role">{{ t('iam.signUp.roleLabel') }}</label>
            <pv-select v-model="fields.role" input-id="iam-role" :options="roles" option-label="label" option-value="value"/>
            <label for="iam-first-name">{{ t('iam.fields.firstName') }}</label>
            <pv-input-text id="iam-first-name" v-model="fields.firstName" autocomplete="given-name" maxlength="100"/>
            <label for="iam-last-name">{{ t('iam.fields.lastName') }}</label>
            <pv-input-text id="iam-last-name" v-model="fields.lastName" autocomplete="family-name" maxlength="100"/>
          </template>
          <template v-if="mode !== 'reset'">
            <pv-icon-field>
              <pv-input-icon class="pi pi-at"/>
              <pv-input-text id="iam-email" v-model="fields.email" type="email" autocomplete="email"
                             :placeholder="t('iam.fields.email') + '*'" :aria-label="t('iam.fields.email')" fluid/>
            </pv-icon-field>
          </template>
          <template v-if="mode !== 'forgot'">
            <div class="password-field">
              <i class="pi pi-lock password-lock" aria-hidden="true"/>
              <pv-input-text id="iam-password" v-model="fields.password" :type="showPassword ? 'text' : 'password'"
                             :aria-label="t(mode === 'reset' ? 'iam.recovery.reset.newPassword' : 'iam.fields.password')"
                             :placeholder="t(mode === 'reset' ? 'iam.recovery.reset.newPassword' : 'iam.fields.password') + '*'"
                             :autocomplete="mode === 'signIn' ? 'current-password' : 'new-password'" fluid/>
              <button class="password-toggle" type="button"
                      :aria-label="t(showPassword ? 'iam.actions.hidePassword' : 'iam.actions.showPassword')"
                      @click="showPassword = !showPassword">
                <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" aria-hidden="true"/>
              </button>
            </div>
            <template v-if="mode !== 'signIn'">
              <label for="iam-confirmation">{{ t('iam.fields.confirmPassword') }}</label>
              <pv-input-text id="iam-confirmation" v-model="fields.confirmation" type="password" autocomplete="new-password"/>
            </template>
          </template>
          <pv-message v-if="error" severity="error">{{ t(error) }}</pv-message>
          <router-link v-if="mode === 'signIn'" class="recovery-link" :to="{name: 'iam-forgot-password'}">
            {{ t('iam.recovery.forgotLink') }}
          </router-link>
          <pv-button class="submit-button" icon="pi pi-arrow-right" icon-pos="right" type="submit" :loading="busy" :label="t(recoveryPreview ? 'iam.recovery.previewSubmit' : key + '.submit')"/>
        </form>
        <div class="auth-links">
          <template v-if="mode === 'signIn'">
            {{ t('iam.signIn.noAccount') }}
            <router-link :to="{name: 'iam-sign-up'}">{{ t('iam.signIn.register') }}</router-link>
          </template>
          <router-link v-else :to="{name: 'iam-sign-in'}">{{ t('iam.recovery.backToSignIn') }}</router-link>
          <router-link v-if="recoveryPreview && mode === 'forgot' && completed"
                       :to="{name: 'iam-reset-password', query: {token: 'preview'}}">{{ t('iam.recovery.previewReset') }}</router-link>
          <router-link v-if="mode === 'reset' && !completed" :to="{name: 'iam-forgot-password'}">{{ t('iam.recovery.requestNewLink') }}</router-link>
        </div>
    <details v-if="mode === 'signIn' && developmentAccounts.length" class="demo-accounts">
      <summary>{{ t('iam.demoAccounts.title') }}</summary>
      <p>{{ t('iam.demoAccounts.description') }}</p>
      <pv-button v-for="account in developmentAccounts" :key="account.id" type="button" outlined
                 :disabled="busy" @click="fillDevelopmentAccount(account.email)">
        <span><strong>{{ t('iam.roles.' + account.role) }}</strong><small>{{ account.email }}</small></span>
      </pv-button>
      <p>{{ t('iam.demoAccounts.hint') }}</p>
    </details>
  </auth-layout>
</template>

<style scoped>
.eyebrow { color: #286643; font-size: 11px; font-weight: 600; letter-spacing: .11em; text-transform: uppercase; }
.auth-heading h1 { margin: 14px 0 12px; font-size: clamp(28px, 3vw, 36px); letter-spacing: -.035em; }
.auth-heading p { color: #52665a; margin: 0 0 28px; font-size: 14px; }
.auth-fields { display: flex; flex-direction: column; gap: 16px; }
.auth-fields :deep(.p-inputtext) { min-height: 54px; border-radius: 12px; background: #f7f8f0; }
.auth-fields :deep(.p-iconfield > .p-inputtext) { padding-inline-start: 3.3rem; }
.auth-fields :deep(.p-iconfield > .p-inputicon:first-child) {
  inset-inline-start: 1.5rem;
  top: 50%;
  margin-top: 0;
  transform: translateY(-50%);
}
.password-field { position: relative; }
.password-field :deep(.p-inputtext) { padding-inline: 3.3rem 3rem; }
.password-lock, .password-toggle {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: #52665a;
  line-height: 1;
}
.password-lock { inset-inline-start: 1.5rem; pointer-events: none; }
.password-toggle {
  inset-inline-end: .25rem;
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 0;
  border-radius: .5rem;
  background: transparent;
  cursor: pointer;
}
.recovery-link { align-self: flex-end; margin-top: 8px; }
a, summary { color: #286643; font-weight: 600; }
.submit-button.p-button { justify-content: center; min-height: 50px; border-radius: 12px; background: #076600; border-color: #076600; }
.submit-button :deep(.p-button-label) { flex: 0 0 auto; }
.auth-links, .demo-accounts { margin-top: 20px; padding: 16px; border: 1px solid #c1cdc2; border-radius: 12px; font-size: 12px; }
.auth-links { text-align: center; }
.demo-accounts { border-style: dashed; }
.demo-accounts summary { cursor: pointer; }
.demo-accounts .p-button { display: flex; width: 100%; margin-top: 8px; border-radius: 10px; }
.demo-accounts small { display: block; margin-top: 4px; color: #52665a; }
.demo-accounts p:last-child { margin-bottom: 0; }
</style>
