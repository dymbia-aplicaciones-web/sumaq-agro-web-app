<script setup>
import {useI18n} from "vue-i18n";

/**
 * Tells the producer that there is no connection, or that some expenses are
 * waiting to be synchronized (Angular `OfflineSyncBanner`).
 */
defineProps({
  online: { type: Boolean, required: true },
  pending: { type: Number, required: true },
  syncing: { type: Boolean, default: false }
});
const emit = defineEmits(['sync']);
const { t } = useI18n();
</script>

<template>
  <div v-if="!online || pending > 0" class="banner" :class="{ offline: !online }" role="status">
    <i :class="online ? 'pi pi-sync' : 'pi pi-cloud'" class="text-xl" aria-hidden="true"/>
    <p>
      <template v-if="!online">{{ t('field-management.offline.no-connection') }}</template>
      <template v-if="pending > 0"> {{ t('field-management.offline.pending', { count: pending }) }}</template>
    </p>
    <pv-button v-if="online && pending > 0" text icon="pi pi-sync" :disabled="syncing"
               :label="t(syncing ? 'field-management.offline.syncing' : 'field-management.offline.sync-now')"
               @click="emit('sync')"/>
  </div>
</template>

<style scoped>
.banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 16px;
  background: var(--sa-secondary-container);
  color: var(--sa-on-secondary-container);
}

/* Material tertiary container of the theme. */
.banner.offline {
  background: #97f0ff;
  color: #001f24;
}

.banner p {
  flex: 1;
  margin: 0;
}
</style>
