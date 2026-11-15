<script setup>
import {ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useCropHealthStore from "../../../crop-health/application/crop-health.store.js";
import AuthenticationSection from "../../../iam/presentation/components/authentication-section.vue";
import useLayoutStore from "../../application/layout.store.js";

const { t } = useI18n();
const layoutStore = useLayoutStore();
const router = useRouter();
const crop = useCropHealthStore();
const search = ref('');
const suggestions = ref([]);

const normalize = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
function findPlots({query}) {
  const term = normalize(query.trim());
  suggestions.value = term ? crop.plots.filter(plot => normalize(plot.name).includes(term))
      .sort((a, b) => Number(normalize(b.name) === term) - Number(normalize(a.name) === term) ||
          a.name.localeCompare(b.name)).slice(0, 8) : [];
}

watch(() => crop.plots, () => {
  findPlots({query: typeof search.value === 'string' ? search.value : ''});
});

function openPlot({value}) {
  search.value = '';
  suggestions.value = [];
  if (!crop.plots.some(plot => plot.id === value.id)) return;
  crop.selectPlot(value.id);
  layoutStore.closeSidebarOnHandset();
  void router.push({name: 'crop-health-monitoring'});
}
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
      <pv-auto-complete v-model="search" :suggestions="suggestions" option-label="name" fluid
                        :placeholder="t('layout.search')" :aria-label="t('layout.search')"
                        :empty-search-message="t(crop.scopeLoading ? 'common.loading' : 'layout.no-plot-matches')"
                        @complete="findPlots" @option-select="openPlot">
        <template #option="{option}">{{ option.name }} · {{ option.region }}</template>
      </pv-auto-complete>
    </pv-icon-field>

    <span class="flex-auto"/>

    <span class="connection" :class="{ 'connection--online': layoutStore.isOnline }" role="status" :aria-label="t('layout.connection')">
      <i :class="layoutStore.isOnline ? 'pi pi-cloud' : 'pi pi-ban'" aria-hidden="true"/>
      {{ t(layoutStore.isOnline ? 'layout.connected' : 'layout.disconnected') }}
    </span>

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
