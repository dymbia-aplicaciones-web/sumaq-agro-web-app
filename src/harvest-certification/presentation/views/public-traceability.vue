<script setup>
import {ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute} from "vue-router";
import useHarvestCertificationStore from "../../application/harvest-certification.store.js";

/** Public QR verification (Angular `PublicTraceabilityView`): shown without the shell or a session. */
const { t } = useI18n();
const route = useRoute();
const store = useHarvestCertificationStore();

const record = ref(null);
const loading = ref(true);
const error = ref(null);

// Each token of the URL starts a new public query.
watch(() => [route.query.number ?? route.params.token, route.query.hash], ([number, hash], _, onCleanup) => {
  let current = true;
  onCleanup(() => { current = false; });
  loading.value = true;
  error.value = null;
  record.value = null;
  store.verifyCertificate(String(number ?? ''), String(hash ?? ''))
      .then(result => {
        if (!current) return;
        if (!result) error.value = 'harvest-certification.trace.unknown-code';
        record.value = result;
      })
      .catch(() => {
        if (current) error.value = 'harvest-certification.trace.api-unavailable';
      })
      .finally(() => {
        if (current) loading.value = false;
      });
}, { immediate: true });
</script>

<template>
  <main class="trace-page">
    <article class="trace-card">
      <p class="eyebrow">SumaqAgro · {{ t('harvest-certification.trace.public-verification') }}</p>
      <h1 v-if="loading">{{ t('harvest-certification.trace.verifying') }}</h1>
      <template v-else-if="error">
        <h1>{{ t('harvest-certification.trace.verification-failed') }}</h1>
        <p role="alert">{{ t(error) }}</p>
      </template>
      <template v-else-if="record.authentic && record.status === 'ACTIVE'">
        <h1>{{ t('harvest-certification.trace.registered') }}</h1>
        <p class="status">{{ t('harvest-certification.trace.active') }} · {{ record.certificateNumber }}</p>
        <dl>
          <dt>{{ t('harvest-certification.trace.batch') }}</dt><dd>{{ record.batchCode }}</dd>
          <dt>{{ t('harvest-certification.trace.product') }}</dt><dd>{{ record.seedVariety || record.cropType }}</dd>
          <template v-if="record.plotName || record.region">
            <dt>{{ t('harvest-certification.trace.origin') }}</dt><dd>{{ [record.plotName, record.region].filter(Boolean).join(', ') }}</dd>
          </template>
          <dt>{{ t('harvest-certification.trace.quality') }}</dt><dd>{{ t(`harvest-certification.quality-category.${record.qualityCategory}`) }}</dd>
        </dl>
      </template>
      <template v-else>
        <h1>{{ t('harvest-certification.trace.verification-failed') }}</h1>
        <p>{{ t('harvest-certification.trace.not-valid') }}</p>
      </template>
    </article>
  </main>
</template>

<style scoped>
.trace-page {
  min-height: 100vh;
  padding: 24px 12px;
}

.trace-card {
  max-width: 760px;
  margin: 25px auto;
  padding: clamp(20px, 4vw, 42px);
  border-radius: 18px;
  background: white;
  box-shadow: 0 4px 18px #0002;
}

.eyebrow {
  color: #08745f;
  font-weight: 700;
}

h1 {
  font-size: clamp(24px, 4vw, 34px);
  line-height: 1.2;
}

.status {
  display: inline-block;
  padding: 8px 12px;
  border-radius: 20px;
  background: #dbf1e3;
  color: #12603e;
  font-weight: 700;
}

dl {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) 2fr;
  gap: 12px;
  margin-top: 25px;
}

dt {
  color: #5f7167;
}

dd {
  margin: 0;
  font-weight: 600;
}

.hash {
  font-size: 11px;
  overflow-wrap: anywhere;
}

@media (max-width: 550px) {
  dl {
    grid-template-columns: 1fr;
    gap: 3px;
  }

  dd {
    margin-bottom: 12px;
  }
}
</style>
