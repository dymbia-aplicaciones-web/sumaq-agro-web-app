<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import LanguageSwitcher from "./language-switcher.vue";
import {activeNavigationLink, navigationFor} from "./navigation-config.js";
import useIamStore from "../../../iam/application/iam.store.js";
import useLayoutStore from "../../application/layout.store.js";
import logo from "../../../assets/logo-sumaqagro.png";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const iamStore = useIamStore();
const layoutStore = useLayoutStore();

/** Side menu generated from the selected user's experience. */
const sections = computed(() => iamStore.currentRole ? navigationFor(iamStore.currentRole) : []);
const activeLink = computed(() => iamStore.currentRole ? activeNavigationLink(iamStore.currentRole, route.path) : null);
</script>

<template>
  <nav class="sidebar-inner" :aria-label="t('layout.menu')">
    <router-link class="brand" to="/" @click="layoutStore.closeSidebarOnHandset()">
      <img :src="logo" alt="SumaqAgro" width="48" height="48"/>
      <span class="brand-text">
        <span class="brand-name">Sumaq<span class="brand-accent">Agro</span></span>
        <span class="brand-tagline">{{ t('app.tagline') }}</span>
      </span>
    </router-link>

    <template v-for="(section, index) in sections" :key="section.title">
      <div class="menu-section">
        <h3 class="menu-title">{{ t(section.title) }}</h3>
        <router-link
            v-for="option in section.options"
            :key="option.link"
            :to="option.link"
            class="menu-item"
            :class="{ 'menu-item--active': activeLink === option.link }"
            :aria-current="activeLink === option.link ? 'page' : undefined"
            @click="layoutStore.closeSidebarOnHandset()">
          <i :class="option.icon" aria-hidden="true"/>
          <span>{{ t(option.label) }}</span>
        </router-link>
      </div>
      <pv-divider v-if="index < sections.length - 1" class="my-1"/>
    </template>

    <div class="offline-reference">
      <i class="pi pi-wifi" aria-hidden="true"/>
      <span>{{ t('layout.offline-mode') }}</span>
    </div>

    <div class="sidebar-footer">
      <language-switcher/>
      <pv-button class="sign-out" icon="pi pi-sign-out" :label="t('layout.sign-out')" @click="iamStore.signOut(router)"/>
    </div>
  </nav>
</template>

<style scoped>
.sidebar-inner {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 12px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px 8px;
  color: inherit;
  text-decoration: none;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  color: var(--sa-tertiary);
  font-size: 22px;
  line-height: 28px;
}

.brand-accent {
  color: var(--sa-primary);
}

.brand-tagline {
  color: var(--sa-on-surface-variant);
  font-size: 11px;
  font-weight: 500;
}

.menu-section {
  padding: 4px 0;
}

.menu-title {
  display: flex;
  align-items: center;
  height: 32px;
  margin: 0;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 500;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 40px;
  padding: 0 16px;
  border-radius: 9999px;
  color: var(--sa-on-surface-variant);
  text-decoration: none;
}

.menu-item i {
  font-size: 1.1rem;
}

.menu-item:hover {
  background: color-mix(in srgb, var(--sa-on-surface) 8%, transparent);
}

.menu-item--active {
  background: var(--sa-secondary-container);
  color: var(--sa-on-secondary-container);
  font-weight: 500;
}

.offline-reference {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 40px;
  padding: 0 16px;
  color: var(--sa-on-surface-variant);
}

.offline-reference i {
  font-size: 1.1rem;
}

.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
  padding: 12px 8px 0;
}

/* Same teal as the dashboard cards, a bit darker. */
.sign-out.p-button {
  width: 100%;
  border-color: var(--sa-sign-out);
  border-radius: 9999px;
  background: var(--sa-sign-out);
  color: var(--sa-on-tertiary);
}
</style>
