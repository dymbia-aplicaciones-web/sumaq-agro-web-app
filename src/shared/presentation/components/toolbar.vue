<script setup>
import {ref} from "vue";
import {useI18n} from "vue-i18n";
import AuthenticationSection from "../../../iam/presentation/components/authentication-section.vue";
import useLayoutStore from "../../application/layout.store.js";

const { t } = useI18n();
const layoutStore = useLayoutStore();
const search = ref('');
/** Pending notifications. Connected to the agroclimatic alerts later (Angular `Toolbar`). */
const notificationCount = ref(0);
</script>

<template>
  <header class="topbar">
    <pv-button
        v-if="layoutStore.isHandset"
        icon="pi pi-bars"
        text rounded severity="secondary"
        :aria-label="t('layout.menu')"
        @click="layoutStore.toggleSidebar()"/>

    <pv-icon-field class="search">
      <pv-input-icon class="pi pi-search"/>
      <pv-input-text v-model="search" type="search" fluid :placeholder="t('layout.search')" :aria-label="t('layout.search')"/>
    </pv-icon-field>

    <span class="flex-auto"/>

    <span class="connection" :class="{ 'connection--online': layoutStore.isOnline }" role="status" :aria-label="t('layout.connection')">
      <i :class="layoutStore.isOnline ? 'pi pi-cloud' : 'pi pi-ban'" aria-hidden="true"/>
      {{ t(layoutStore.isOnline ? 'layout.connected' : 'layout.disconnected') }}
    </span>

    <pv-button
        v-tooltip.bottom="t('layout.notifications')"
        :badge="notificationCount > 0 ? String(notificationCount) : undefined"
        badge-severity="danger"
        icon="pi pi-bell"
        text rounded severity="secondary"
        :aria-label="t('layout.notifications')"/>

    <authentication-section/>
  </header>
</template>

<style scoped>
/* The bar stays on top while the content scrolls. */
.topbar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 12px;
  height: var(--sa-toolbar-height);
  padding: 0 16px;
  background: var(--sa-surface-container-low);
}

.search {
  flex: 0 1 640px;
  min-width: 0;
}

.connection {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--sa-outline-variant);
  border-radius: 8px;
  color: var(--sa-on-surface-variant);
  font-weight: 500;
  white-space: nowrap;
}

.connection--online {
  border-color: transparent;
  background: var(--sa-secondary-container);
  color: var(--sa-on-secondary-container);
}

@media (max-width: 959.98px) {
  .connection {
    display: none;
  }
}
</style>
