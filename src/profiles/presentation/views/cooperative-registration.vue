<script setup>
import {reactive, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRouter} from 'vue-router';
import useProfilesStore from '../../application/profiles.store.js';

const {t} = useI18n();
const router = useRouter();
const store = useProfilesStore();
const key = 'profiles.cooperative.registration';
const form = reactive({ legalName: '', ruc: '', region: '' });
const submitted = ref(false);
const error = ref('');

async function submit() {
    submitted.value = true;
    error.value = '';
    if (!form.legalName.trim() || !form.region.trim() || !/^\d{11}$/.test(form.ruc)) return;
    try {
        const saved = await store.registerCooperative({
            legalName: form.legalName.trim(), ruc: form.ruc, region: form.region.trim()
        });
        if (saved) await router.push({ name: 'profiles-cooperative-dashboard' });
    } catch (cause) {
        error.value = cause.message;
    }
}
</script>

<template>
  <section class="p-4">
    <router-link :to="{ name: 'profiles-cooperative-dashboard' }">{{ t(key + '.back') }}</router-link>
    <h1>{{ t(key + '.title') }}</h1>
    <p>{{ t(key + '.subtitle') }}</p>
    <form class="flex flex-column gap-3" novalidate @submit.prevent="submit">
      <label for="legal-name">{{ t(key + '.legal-name') }}</label>
      <pv-input-text id="legal-name" v-model="form.legalName" required/>
      <small v-if="submitted && !form.legalName.trim()">{{ t(key + '.required') }}</small>
      <label for="ruc">{{ t(key + '.ruc') }}</label>
      <pv-input-text id="ruc" v-model="form.ruc" inputmode="numeric" maxlength="11" required/>
      <small v-if="submitted && !/^\d{11}$/.test(form.ruc)">{{ t(key + '.ruc-error') }}</small>
      <label for="region">{{ t(key + '.region') }}</label>
      <pv-input-text id="region" v-model="form.region" required/>
      <small v-if="submitted && !form.region.trim()">{{ t(key + '.required') }}</small>
      <pv-message v-if="error" severity="error">{{ t(error) }}</pv-message>
      <pv-button class="align-self-start" type="submit" :loading="store.saving" :label="t(key + (store.saving ? '.saving' : '.submit'))"/>
    </form>
  </section>
</template>
