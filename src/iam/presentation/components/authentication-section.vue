<script setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {settingsRouteFor} from "../../../shared/presentation/components/navigation-config.js";
import useIamStore from "../../application/iam.store.js";

const { t } = useI18n();
const router = useRouter();
const store = useIamStore();
const menu = ref();

const items = computed(() => {
  const settings = settingsRouteFor(store.currentRole);
  return [
  ...(settings ? [{ label: 'layout.profile', icon: 'pi pi-user', command: () => router.push(settings) }, { separator: true }] : []),
  { label: 'layout.sign-out', icon: 'pi pi-sign-out', command: () => store.signOut(router) }
  ];
});

/**
 * Opens or closes the user menu.
 * @param {Event} event - Click event.
 */
const toggleMenu = (event) => menu.value.toggle(event);
</script>

<template>
  <pv-button text severity="secondary" class="user-button" aria-haspopup="true" aria-controls="user-menu" @click="toggleMenu">
    <i class="pi pi-user user-avatar" aria-hidden="true"/>
    <span class="user-name">{{ store.currentUser?.displayName }}</span>
    <i class="pi pi-chevron-down" aria-hidden="true"/>
  </pv-button>
  <pv-menu id="user-menu" ref="menu" :model="items" popup>
    <template #item="{ item, props }">
      <a v-bind="props.action">
        <i :class="item.icon"/>
        <span>{{ t(item.label) }}</span>
      </a>
    </template>
  </pv-menu>
</template>

<style scoped>
.user-button.p-button {
  flex-shrink: 0;
  gap: 8px;
  color: var(--sa-on-surface);
  white-space: nowrap;
}

.user-avatar {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--sa-tertiary);
  color: var(--sa-tertiary);
}

@media (max-width: 959.98px) {
  .user-name {
    display: none;
  }
}
</style>
