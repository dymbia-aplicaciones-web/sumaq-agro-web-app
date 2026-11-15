<script setup>
import "../../../shared/presentation/charts.js";
import {computed, onMounted} from "vue";
import {Line} from "vue-chartjs";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useProfilesStore from "../../application/profiles.store.js";
import useIamStore from "../../../iam/application/iam.store.js";
import {formatCurrency, formatNumber} from "../../../shared/presentation/format.js";

/** Institutional dashboard of the cooperative director (Angular `CooperativeDashboardView`). */
const { t, locale } = useI18n();
const router = useRouter();
const store = useProfilesStore();
const iamStore = useIamStore();

onMounted(() => {
  if (iamStore.currentRole === 'COOPERATIVE_DIRECTOR') store.loadCooperativeDashboard(iamStore.currentUserId);
});

const chartData = computed(() => {
  const dashboard = store.dashboard;
  if (!dashboard) return null;
  return {
    labels: dashboard.ndviTrend.map(point => point.month),
    datasets: [{ data: dashboard.ndviTrend.map(point => point.value), borderColor: '#2e8b57', backgroundColor: 'rgba(46, 139, 87, 0.12)', fill: true, tension: 0.3, pointRadius: 0 }]
  };
});
const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 0.8, ticks: { stepSize: 0.2 } } } };
</script>

<template>
  <div class="page">
    <pv-progress-bar v-if="store.loading" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>

    <template v-if="store.dashboard">
      <header class="flex flex-wrap align-items-end justify-content-between gap-3">
        <div>
          <span class="eyebrow">{{ t('profiles.cooperative.dashboard.breadcrumb') }}</span>
          <h1>{{ t('profiles.cooperative.dashboard.title', { cooperative: store.dashboard.cooperativeName }) }}</h1>
          <p class="sa-muted m-0">{{ t('profiles.cooperative.dashboard.subtitle', { members: store.dashboard.activeMembers, hectares: store.dashboard.monitoredHectares }) }}</p>
        </div>
        <pv-select :model-value="store.dashboard.campaignName" :options="[store.dashboard.campaignName]" disabled style="width: 180px"/>
      </header>

      <section class="kpi-grid">
        <pv-card class="kpi-card collection-card">
          <template #content>
            <div class="kpi-body">
              <h2><i class="pi pi-sun" aria-hidden="true"/>{{ t('profiles.cooperative.dashboard.collection-title') }}</h2>
              <strong>{{ formatNumber(store.dashboard.collectionTons, locale, 1, 1) }} Tn / {{ formatNumber(store.dashboard.collectionGoalTons, locale, 0) }} Tn {{ t('profiles.cooperative.dashboard.goal') }}</strong>
              <p>{{ formatNumber(store.dashboard.collectionProgress, locale, 0) }}% {{ t('profiles.cooperative.dashboard.campaign-progress') }}</p>
              <pv-progress-bar :value="Math.round(store.dashboard.collectionProgress)" :show-value="false" class="kpi-progress"/>
              <pv-button class="kpi-action" icon="pi pi-users" :label="t('profiles.cooperative.dashboard.view-members')" @click="router.push('/profiles/cooperative/members')"/>
            </div>
          </template>
        </pv-card>
        <pv-card class="kpi-card vegetation-card">
          <template #content>
            <div class="kpi-body">
              <h2><i class="pi pi-dollar" aria-hidden="true"/>{{ t('profiles.cooperative.dashboard.vegetation-title') }}</h2>
              <strong>{{ store.dashboard.optimalPlotsPercentage }}% {{ t('profiles.cooperative.dashboard.optimal-plots') }}</strong>
              <p>{{ store.dashboard.stressedPlotsPercentage }}% {{ t('profiles.cooperative.dashboard.stress-risk') }}</p>
              <pv-progress-bar :value="store.dashboard.optimalPlotsPercentage" :show-value="false" class="kpi-progress"/>
              <pv-button class="kpi-action" icon="pi pi-map" :label="t('profiles.cooperative.dashboard.view-irrigation-map')" @click="router.push('/crop-health/monitoring')"/>
            </div>
          </template>
        </pv-card>
        <pv-card class="kpi-card cost-card">
          <template #content>
            <div class="kpi-body">
              <h2><i class="pi pi-chart-line" aria-hidden="true"/>{{ t('profiles.cooperative.dashboard.cost-title') }}</h2>
              <strong>{{ formatCurrency(store.dashboard.averageCostPerHectare) }} / Ha</strong>
              <p>{{ t('profiles.cooperative.dashboard.cost-description') }}</p>
              <pv-button class="kpi-action" icon="pi pi-receipt" :label="t('profiles.cooperative.dashboard.view-cost-matrix')" @click="router.push('/field-management/finances')"/>
            </div>
          </template>
        </pv-card>
      </section>

      <section class="details-grid">
        <pv-card class="sa-card">
          <template #content>
            <h2 class="section-title">{{ t('profiles.cooperative.dashboard.ndvi-title') }}</h2>
            <div class="flex flex-wrap gap-3">
              <pv-button outlined icon="pi pi-chevron-down" icon-pos="right" :label="`${t('profiles.cooperative.dashboard.range')}: ${t('profiles.cooperative.dashboard.all-campaign')}`"/>
              <pv-button outlined icon="pi pi-chevron-down" icon-pos="right" :label="`${t('profiles.cooperative.dashboard.filter')}: ${t('profiles.cooperative.dashboard.potato-coffee')}`"/>
            </div>
            <div v-if="chartData" class="chart"><Line :data="chartData" :options="chartOptions"/></div>
          </template>
        </pv-card>
        <pv-card class="sa-card">
          <template #content>
            <div class="flex flex-column quality-body">
              <h2 class="section-title">{{ t('profiles.cooperative.dashboard.quality-title') }}</h2>
              <p class="sa-muted m-0">{{ t('profiles.cooperative.dashboard.evaluated-lots', { lots: store.dashboard.evaluatedLots }) }}</p>
              <dl>
                <div><dt>{{ t('profiles.cooperative.dashboard.specialty-coffee') }}</dt><dd>{{ store.dashboard.specialtyCoffeePercentage }}%</dd></div>
                <div><dt>{{ t('profiles.cooperative.dashboard.first-grade-potato') }}</dt><dd>{{ store.dashboard.firstGradePotatoPercentage }}%</dd></div>
                <div><dt>{{ t('profiles.cooperative.dashboard.loss-lots') }}</dt><dd>{{ store.dashboard.lossLotsPercentage }}%</dd></div>
              </dl>
              <pv-button class="align-self-center mt-auto" icon="pi pi-plus" :label="t('profiles.cooperative.dashboard.register-income')"
                         @click="router.push('/harvest-certification/certificates')"/>
            </div>
          </template>
        </pv-card>
      </section>
    </template>

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
