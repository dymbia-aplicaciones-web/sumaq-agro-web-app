<script setup>
import {onMounted} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useProfilesStore from "../../application/profiles.store.js";
import useIamStore from "../../../iam/application/iam.store.js";
import {formatNumber} from "../../../shared/presentation/format.js";

/** Institutional dashboard of the cooperative director (Angular `CooperativeDashboardView`). */
const { t, locale } = useI18n();
const router = useRouter();
const store = useProfilesStore();
const iamStore = useIamStore();

onMounted(() => {
  if (iamStore.currentRole === 'COOPERATIVE_DIRECTOR') store.loadCooperativeDashboard(iamStore.currentUserId);
});

</script>

<template>
  <div class="page">
    <pv-progress-bar v-if="store.loading" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>

    <pv-card v-if="store.dashboard" class="sa-card">
      <template #title>
        {{ t('profiles.cooperative.dashboard.title', { cooperative: store.dashboard.cooperativeName }) }}
      </template>
      <template #content>
        <p>{{ t('profiles.cooperative.dashboard.subtitle', {
          members: store.dashboard.activeMembers,
          hectares: formatNumber(store.dashboard.monitoredHectares, locale, 0, 2)
        }) }}</p>
        <pv-button icon="pi pi-users" :label="t('profiles.cooperative.dashboard.view-members')"
                   @click="router.push('/profiles/cooperative/members')"/>
      </template>
    </pv-card>

    <pv-card v-else-if="!store.loading && !store.error" class="sa-card text-center">
      <template #content>
        <i class="pi pi-building text-5xl empty-icon" aria-hidden="true"/>
        <p v-if="store.cooperative">{{ t('profiles.cooperative.dashboard.no-metrics') }}</p>
        <template v-else>
        <h1>{{ t('profiles.cooperative.dashboard.no-cooperative-title') }}</h1>
        <p>{{ t('profiles.cooperative.dashboard.no-cooperative-message') }}</p>
        <router-link :to="{ name: 'profiles-cooperative-registration' }">
          {{ t('profiles.cooperative.dashboard.register-cooperative') }}
        </router-link>
        </template>
      </template>
    </pv-card>
    <p v-if="store.error" class="sa-error" role="alert">{{ store.error }}</p>
  </div>
</template>

<style scoped>
.eyebrow {
  color: var(--sa-primary);
  font-weight: 500;
}

h1 {
  margin: 6px 0 4px;
  font-size: 36px;
  font-weight: 700;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.kpi-card {
  min-height: 190px;
  border-radius: 20px;
  color: white;
}

.collection-card { background: #246a5d; }
.vegetation-card { background: #007b6d; }
.cost-card { background: #008576; }

.kpi-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  height: 100%;
}

.kpi-body h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 20px;
}

.kpi-body strong {
  font-size: 20px;
}

.kpi-body p {
  margin: 0;
  opacity: 0.9;
}

.kpi-progress {
  width: 100%;
  height: 6px;
  margin: 8px 0;
}

.kpi-progress :deep(.p-progressbar-value) {
  background: #65c466;
}

.kpi-action.p-button {
  margin-top: auto;
  border-color: white;
  background: white;
  color: #1a4f41;
}

.details-grid {
  display: grid;
  grid-template-columns: 3fr 1.45fr;
  gap: 24px;
}

.section-title {
  margin: 0 0 12px;
  font-size: 20px;
}

.chart {
  height: 270px;
  margin-top: 16px;
}

.quality-body {
  min-height: 300px;
}

dl {
  display: grid;
  gap: 18px;
  margin: 24px 0;
}

dl div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

dt, dd {
  margin: 0;
}

dd {
  color: var(--sa-primary);
  font-weight: 700;
}

.empty-icon {
  color: var(--sa-primary);
}

@media (max-width: 960px) {
  .kpi-grid,
  .details-grid {
    grid-template-columns: 1fr;
  }
}
</style>
