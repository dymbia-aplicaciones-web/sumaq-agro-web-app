<script setup>
import {useRouter} from 'vue-router';
import {useI18n} from 'vue-i18n';
import LanguageSwitcher from '../../../shared/presentation/components/language-switcher.vue';
import useIamStore from '../../../iam/application/iam.store.js';

const {t} = useI18n();
const iam = useIamStore();
const router = useRouter();
</script>

<template>
  <div class="subscriptions-shell min-h-screen">
    <header class="flex flex-wrap align-items-center justify-content-between gap-3 px-4 py-3">
      <div class="flex align-items-center gap-2">
        <img src="/images/logo-sumaqagro.png" alt="" width="40" height="40"/>
        <strong>Sumaq<span>Agro</span></strong>
      </div>
      <div class="flex align-items-center gap-3">
        <language-switcher class="shell-language"/>
        <pv-button text icon="pi pi-sign-out" :label="t('layout.sign-out')" :aria-label="t('layout.sign-out')" @click="iam.signOut(router)"/>
      </div>
    </header>
    <main class="px-4 py-3 mx-auto" style="max-width: 72rem">
      <router-view/>
    </main>
  </div>
</template>

<style scoped>
.subscriptions-shell { background: #f1f2ea; }
strong { font-size: 1.35rem; }
strong span { color: #076600; }
.shell-language { width: auto; }
</style>
