<script setup>
import {certificateVerificationRoute} from "../utils/certificate-verification.js";
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import useHarvestCertificationStore from "../../application/harvest-certification.store.js";
import useIamStore from "../../../iam/application/iam.store.js";
import HarvestBatchRegistration from "../components/harvest-batch-registration.vue";
import HarvestGradingSheet from "../components/harvest-grading-sheet.vue";
import {printCertificate} from "../components/certificate-print.js";
import CertificateDocument from "../components/certificate-document.vue";
import {formatDate, formatNumber} from "../../../shared/presentation/format.js";

/**
 * Harvest certificates (Angular `HarvestCertificatesView`): the farmer sees
 * their certificates with the QR; the cooperative evaluates batches, issues
 * and lists the official certificates.
 */
const { t, locale } = useI18n();
const store = useHarvestCertificationStore();
const iamStore = useIamStore();

const isFarmer = computed(() => iamStore.currentRole === 'FARMER');
const visibleQr = ref(null);
const search = ref('');
const cropFilter = ref('ALL');
const qualityFilter = ref('ALL');
const page = ref(1);
const pageSize = 8;
/** 'closed' | 'form' | 'preview' | 'issued' */
const dialog = ref('closed');
const selectedBatch = ref(null);
const selectedCertificate = ref(null);
const draft = ref(null);
const formError = ref(null);
const busy = ref(false);

const emptyForm = () => ({ memberId: null, plotId: null, grossKg: 0, tareKg: 0, sampleKg: 1, firstPercentage: 72,
  secondPercentage: 20, thirdPercentage: 8, weevilDamagePercentage: 1.2, scaScore: 85 });
const form = ref(emptyForm());

const cropOptions = [
  { value: 'ALL', label: 'harvest-certification.filters.all-masculine' },
  { value: 'ANDEAN_POTATO', label: 'harvest-certification.filters.potato' },
  { value: 'SPECIALTY_COFFEE', label: 'harvest-certification.filters.coffee' }
];
const qualityOptions = [
  { value: 'ALL', label: 'harvest-certification.filters.all-feminine' },
  ...['PREMIUM_GOLD', 'STANDARD', 'B_GRADE_REQUIRES_SORTING', 'SPECIALTY_COFFEE', 'COMMERCIAL_COFFEE'].map(value => ({ value, label: `harvest-certification.quality-category.${value}` }))
];

onMounted(() => store.load());

/** Certificates of the farmer's own batches. */
const farmerCertificates = computed(() => store.activeCertificates.flatMap(certificate => {
  const batch = store.batches.find(item => item.id === certificate.harvestBatchId);
  return batch ? [{ certificate, batch }] : [];
}));

/** Certificates of the cooperative filtered by text, crop and quality. */
const rows = computed(() => {
  const term = search.value.trim().toLocaleLowerCase();
  return store.certificates.flatMap(certificate => {
    const batch = store.batches.find(item => item.id === certificate.harvestBatchId);
    return batch ? [{ certificate, batch }] : [];
  }).filter(({ certificate, batch }) =>
      (!term || `${batch.code} ${batch.memberName} ${certificate.certificateNumber}`.toLocaleLowerCase().includes(term)) &&
      (cropFilter.value === 'ALL' || batch.cropType === cropFilter.value) &&
      (qualityFilter.value === 'ALL' || batch.qualityCategory === qualityFilter.value));
});
watch([search, cropFilter, qualityFilter], () => page.value = 1);
const pageCount = computed(() => Math.max(1, Math.ceil(rows.value.length / pageSize)));
const visibleRows = computed(() => rows.value.slice((page.value - 1) * pageSize, page.value * pageSize));

const plotsForMember = computed(() => store.members.find(member => member.id === form.value.memberId)?.plots ?? []);
const selectedCrop = computed(() => plotsForMember.value.find(plot => plot.id === form.value.plotId)?.cropType ?? 'ANDEAN_POTATO');

const certificationRate = computed(() => store.batches.length ? Math.round(store.activeCertificates.length / store.batches.length * 100) : 0);
const potatoFirstRate = computed(() => {
  const graded = store.batches.filter(batch => batch.potatoGrading);
  return graded.length ? Math.round(graded.reduce((total, batch) => total + batch.potatoGrading.firstPercentage, 0) / graded.length) : 0;
});
const specialtyCoffeeCount = computed(() => store.batches.filter(batch => batch.qualityCategory === 'SPECIALTY_COFFEE').length);

const verificationUrl = certificate => `${window.location.origin}${router.resolve(certificateVerificationRoute(certificate)).href}`;
const farmerQrUrl = certificate => `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(verificationUrl(certificate))}`;
const toggleFarmerQr = id => visibleQr.value = visibleQr.value === id ? null : id;

/** Opens the evaluation dialog with an empty form. */
const openNew = () => {
  if (!store.canIssue) return;
  const member = store.members.find(item => item.plots.length);
  form.value = { ...emptyForm(), memberId: member?.id ?? null, plotId: member?.plots[0]?.id ?? null };
  formError.value = null;
  busy.value = false;
  selectedBatch.value = null;
  selectedCertificate.value = null;
  draft.value = null;
  dialog.value = 'form';
};

/** Selects the first plot of the chosen member. */
const changeMember = () => {
  form.value.plotId = plotsForMember.value[0]?.id ?? 0;
  formError.value = null;
};

/** Loads example values for the selected crop. */
const loadExample = () => {
  if (selectedCrop.value === 'SPECIALTY_COFFEE') Object.assign(form.value, { grossKg: 2600, tareKg: 100, sampleKg: 1, scaScore: 86.5 });
  else Object.assign(form.value, { grossKg: 8568, tareKg: 168, sampleKg: 10, firstPercentage: 72, secondPercentage: 20, thirdPercentage: 8, weevilDamagePercentage: 1.2 });
  formError.value = null;
};

/** @param {Object} certificate - Certificate to show. */
const showCertificate = (certificate) => {
  draft.value = null;
  selectedCertificate.value = certificate;
  selectedBatch.value = store.batches.find(batch => batch.id === certificate.harvestBatchId) ?? null;
  dialog.value = 'issued';
};

/** Validates the sheet and shows the certificate preview. */
const preview = async () => {
  formError.value = null;
  const result = await store.prepareDraft({ ...form.value });
  if ('key' in result) {
    formError.value = result;
    return;
  }
  draft.value = result;
  selectedBatch.value = result.batch;
  dialog.value = 'preview';
};

/** Registers the batch and issues its certificate. */
const issue = () => {
  if (!draft.value || busy.value) return;
  busy.value = true;
  store.issue(draft.value).then(result => {
    busy.value = false;
    if (!result) return;
    selectedBatch.value = result.batch;
    selectedCertificate.value = result.certificate;
    dialog.value = 'issued';
  });
};

const dialogVisible = computed({
  get: () => dialog.value !== 'closed',
  set: visible => { if (!visible) dialog.value = 'closed'; }
});

const print = async () => {
  await nextTick();
  const documentElement = document.getElementById('print-certificate');
  if (documentElement && selectedCertificate.value) await printCertificate(documentElement);
};

const printFarmerCertificate = async certificate => {
  selectedCertificate.value = certificate;
  selectedBatch.value = store.batches.find(batch => batch.id === certificate.harvestBatchId);
  try {
    await print();
  } finally {
    selectedCertificate.value = null;
    selectedBatch.value = null;
  }
};

watch(() => iamStore.currentUser, () => {
  dialog.value = 'closed';
  selectedBatch.value = null;
  selectedCertificate.value = null;
  draft.value = null;
  visibleQr.value = null;
});
</script>

<template>
  <div class="harvest">
    <pv-progress-bar v-if="store.loading" mode="indeterminate" style="height: 4px" :aria-label="t('harvest-certification.loading')"/>

    <!-- Farmer: own certificates with the QR -->
    <div v-if="isFarmer">
      <div v-if="selectedBatch && selectedCertificate" hidden>
        <certificate-document :batch="selectedBatch" :certificate="selectedCertificate"/>
      </div>
      <header class="mb-3">
        <h1 class="farmer-title">{{ t('harvest-certification.farmer.title') }}</h1>
        <p class="farmer-subtitle">{{ t('harvest-certification.farmer.subtitle') }}</p>
      </header>
      <pv-message v-if="store.notice" severity="info">{{ t(store.notice) }}</pv-message>
      <div v-if="store.error" class="error-banner" role="alert">
        {{ t('harvest-certification.load-save-error') }} {{ t(store.error) }}
        <button type="button" @click="store.load()">{{ t('common.retry') }}</button>
      </div>
      <article v-for="row in farmerCertificates" :key="row.certificate.id" class="farmer-certificate">
        <h2>{{ t('harvest-certification.farmer.certificate-title', { code: row.batch.code }) }}</h2>
        <p class="farmer-details">
          {{ t('harvest-certification.farmer.crop') }}: {{ row.batch.variety }} | {{ t('harvest-certification.farmer.farm') }}: {{ row.batch.plotName }} ({{ row.batch.plotRegion }})
          | {{ t('harvest-certification.farmer.issued') }}: {{ formatDate(row.certificate.issuedAt, locale, { dateStyle: 'short' }) }}
        </p>
        <p><strong class="grading">{{ t('harvest-certification.farmer.grading') }}:</strong>
          <template v-if="row.batch.potatoGrading">{{ t('harvest-certification.farmer.potato-grading', { first: row.batch.potatoGrading.firstPercentage, second: row.batch.potatoGrading.secondPercentage, third: row.batch.potatoGrading.thirdPercentage }) }}</template>
          <template v-else>{{ t('harvest-certification.farmer.coffee-grading', { score: row.batch.coffeeCupping?.totalScore }) }}</template>
        </p>
        <div class="farmer-seal">
          <span>{{ t('harvest-certification.farmer.digital-seal') }}:</span>
          <span class="seal-badge">{{ t('harvest-certification.farmer.accredited') }}</span>
        </div>
        <div class="flex flex-wrap align-items-center gap-3 mt-3">
          <pv-button icon="pi pi-qrcode" :label="t('harvest-certification.farmer.show-qr')" @click="toggleFarmerQr(row.certificate.id)"/>
          <pv-button outlined icon="pi pi-download" :label="t('harvest-certification.farmer.download-pdf')" @click="printFarmerCertificate(row.certificate)"/>
          <a class="p-button p-button-outlined no-underline" :href="verificationUrl(row.certificate)" target="_blank" rel="noopener">{{ t('harvest-certification.farmer.web-record') }}</a>
        </div>
        <div v-if="visibleQr === row.certificate.id" class="farmer-qr-panel">
          <img :src="farmerQrUrl(row.certificate)" width="180" height="180" :alt="t('harvest-certification.farmer.qr-alt')"/>
          <p>{{ t('harvest-certification.farmer.qr-instruction') }}</p>
        </div>
      </article>
      <div v-if="farmerCertificates.length === 0 && !store.loading && !store.error" class="farmer-empty">{{ t('harvest-certification.farmer.empty') }}</div>
      <aside class="farmer-tip"><i class="pi pi-lightbulb" aria-hidden="true"/><span>{{ t('harvest-certification.farmer.tip') }}</span></aside>
    </div>

    <!-- Cooperative: official certificates -->
    <template v-else>
      <header class="page-header">
        <div>
          <p class="eyebrow">{{ t('harvest-certification.home') }} <span>›</span> {{ t('harvest-certification.quality-improvement') }} <span>›</span> {{ t('harvest-certification.official-certificates') }}</p>
          <h1>{{ t('harvest-certification.title') }}</h1>
          <p class="subtitle">{{ t('harvest-certification.subtitle') }}</p>
        </div>
        <div class="header-actions">
          <span class="campaign">{{ t('harvest-certification.campaign') }} 2026-I <i class="pi pi-chevron-down" aria-hidden="true"/></span>
          <pv-button class="primary-action" icon="pi pi-plus" :label="t('harvest-certification.evaluate-new')" :disabled="!store.canIssue || store.loading || !store.members.some(member => member.plots.length)" @click="openNew"/>
        </div>
      </header>

      <pv-message v-if="store.notice" severity="info">{{ t(store.notice) }}</pv-message>
      <div v-if="store.error" class="error-banner" role="alert">
        {{ t('harvest-certification.load-save-error') }} {{ t(store.error) }}
        <button type="button" @click="store.load()">{{ t('common.retry') }}</button>
      </div>

      <h2 class="section-label">{{ t('harvest-certification.kpi.title') }}</h2>
      <section class="kpi-grid" :aria-label="t('harvest-certification.kpi.summary')">
        <article class="kpi-card">
          <span>{{ t('harvest-certification.kpi.total') }}</span>
          <strong>{{ t('harvest-certification.kpi.issued-count', { count: store.activeCertificates.length }) }}</strong>
          <small>{{ t('harvest-certification.kpi.public-verification') }}</small>
        </article>
        <article class="kpi-card">
          <span>{{ t('harvest-certification.kpi.certified-batches') }}</span>
          <strong>{{ t('harvest-certification.kpi.certification-rate', { rate: certificationRate }) }}</strong>
          <small>{{ t('harvest-certification.kpi.first-potato-average', { rate: potatoFirstRate }) }}</small>
        </article>
        <article class="kpi-card">
          <span>{{ t('harvest-certification.kpi.specialty-coffee') }}</span>
          <strong>{{ t('harvest-certification.kpi.qualified-count', { count: specialtyCoffeeCount }) }}</strong>
          <small>{{ t('harvest-certification.kpi.sca-threshold') }}</small>
        </article>
      </section>

      <section class="filters" :aria-label="t('harvest-certification.filters.summary')">
        <h2>{{ t('harvest-certification.filters.title') }}</h2>
        <div class="flex flex-wrap align-items-center gap-3">
          <pv-icon-field class="search">
            <pv-input-icon class="pi pi-search"/>
            <pv-input-text v-model="search" type="search" fluid :placeholder="t('harvest-certification.filters.search')"/>
          </pv-icon-field>
          <label class="flex align-items-center gap-2">{{ t('harvest-certification.filters.crop') }}
            <pv-select v-model="cropFilter" :options="cropOptions" option-value="value">
              <template #value="{ value }">{{ t(cropOptions.find(item => item.value === value)?.label ?? '') }}</template>
              <template #option="{ option }">{{ t(option.label) }}</template>
            </pv-select>
          </label>
          <label class="flex align-items-center gap-2">{{ t('harvest-certification.filters.quality') }}
            <pv-select v-model="qualityFilter" :options="qualityOptions" option-value="value">
              <template #value="{ value }">{{ t(qualityOptions.find(item => item.value === value)?.label ?? '') }}</template>
              <template #option="{ option }">{{ t(option.label) }}</template>
            </pv-select>
          </label>
        </div>
      </section>

      <section class="table-shell" :aria-label="t('harvest-certification.table.summary')">
        <div class="table-title">{{ t('harvest-certification.table.title') }}</div>
        <pv-data-table :value="visibleRows" data-key="certificate.id" table-style="min-width: 720px" size="small">
          <pv-column :header="t('harvest-certification.table.batch-code')"><template #body="{ data }">{{ data.batch.code }}</template></pv-column>
          <pv-column :header="t('harvest-certification.table.producer')"><template #body="{ data }">{{ data.batch.memberName }}</template></pv-column>
          <pv-column :header="t('harvest-certification.table.crop-variety')">
            <template #body="{ data }">{{ data.batch.variety }}<small class="block sa-muted">{{ data.batch.plotName }}</small></template>
          </pv-column>
          <pv-column :header="t('harvest-certification.table.volume')"><template #body="{ data }">{{ formatNumber(data.batch.netKg, locale) }} kg</template></pv-column>
          <pv-column :header="t('harvest-certification.table.quality')">
            <template #body="{ data }">
              <template v-if="data.batch.cropType === 'SPECIALTY_COFFEE'">{{ t('harvest-certification.table.sca-points', { score: data.batch.coffeeCupping?.totalScore }) }}</template>
              <template v-else>{{ t('harvest-certification.table.first-rate', { rate: data.batch.potatoGrading?.firstPercentage }) }}</template>
            </template>
          </pv-column>
          <pv-column :header="t('harvest-certification.table.issued')"><template #body="{ data }">{{ formatDate(data.certificate.issuedAt, locale, { dateStyle: 'short' }) }}</template></pv-column>
          <pv-column :header="t('harvest-certification.table.document')">
            <template #body="{ data }"><pv-button outlined size="small" :label="t('harvest-certification.table.view-certificate')" @click="showCertificate(data.certificate)"/></template>
          </pv-column>
          <template #empty><div class="text-center p-3">{{ t('harvest-certification.table.empty') }}</div></template>
        </pv-data-table>
      </section>
      <div class="pagination">
        <span>{{ t('harvest-certification.table.showing', { shown: visibleRows.length, total: rows.length }) }}</span>
        <div class="flex align-items-center gap-2">
          <pv-button text size="small" icon="pi pi-chevron-left" :disabled="page === 1" @click="page--"/>
          <span>{{ page }} / {{ pageCount }}</span>
          <pv-button text size="small" icon="pi pi-chevron-right" :disabled="page === pageCount" @click="page++"/>
        </div>
      </div>

      <pv-dialog v-model:visible="dialogVisible" :closable="!busy" :close-on-escape="!busy" modal class="evaluation-dialog" :style="{ width: '820px', maxWidth: 'calc(100vw - 30px)' }">
        <template #header>
          <div>
            <h2 class="dialog-title">{{ t('harvest-certification.modal.title') }}</h2>
            <p class="m-0 text-sm font-semibold">{{ t('harvest-certification.modal.active-campaign') }}: 2026-I <span class="mx-2">|</span> {{ t('harvest-certification.modal.intake-record') }}</p>
          </div>
        </template>

        <template v-if="dialog === 'form'">
          <harvest-batch-registration v-model:form="form" :members="store.members" :plots="plotsForMember" @member-changed="changeMember"/>
          <button type="button" class="example-button" @click="loadExample">{{ t('harvest-certification.modal.load-example') }}</button>
          <harvest-grading-sheet v-model:form="form" :crop-type="selectedCrop"/>
          <p v-if="formError" class="form-error" role="alert">{{ t(formError.key, formError.params ?? {}) }}</p>
        </template>
        <template v-else-if="selectedBatch">
          <p class="form-section-title">{{ t(dialog === 'issued' ? 'harvest-certification.modal.certificate-issued' : 'harvest-certification.modal.certificate-preview') }}</p>
          <certificate-document :batch="selectedBatch" :certificate="selectedCertificate" :draft="dialog === 'preview' ? draft : null"/>
          <label v-if="dialog === 'preview'" class="flex align-items-center gap-2 mt-3 text-sm">
            <pv-checkbox binary disabled/> {{ t('harvest-certification.modal.sms-pending') }}
          </label>
        </template>

        <pv-message v-if="dialog === 'preview' && store.error" severity="error">{{ t(store.error) }}</pv-message>
        <template #footer>
          <div class="flex justify-content-end gap-3 w-full">
            <template v-if="dialog === 'form'">
              <pv-button outlined severity="secondary" :label="t('common.cancel')" @click="dialog = 'closed'"/>
              <pv-button class="primary-action" :label="t('harvest-certification.modal.review')" @click="preview"/>
            </template>
            <template v-else-if="dialog === 'preview'">
              <pv-button outlined severity="secondary" icon="pi pi-arrow-left" :label="t('harvest-certification.modal.modify')" :disabled="busy || !!draft?.savedBatch" @click="dialog = 'form'"/>
              <pv-button class="primary-action" :label="t('harvest-certification.modal.issue')" :disabled="busy || store.loading" @click="issue"/>
            </template>
            <template v-else>
              <pv-button outlined severity="secondary" :label="t('harvest-certification.modal.close')" @click="dialog = 'closed'"/>
              <pv-button class="primary-action" icon="pi pi-print" :label="t('harvest-certification.modal.print')" @click="print"/>
            </template>
          </div>
        </template>
      </pv-dialog>
    </template>
  </div>
</template>

<style scoped>
.harvest {
  padding: 8px 2px 36px;
  color: #17362e;
}

.farmer-title {
  margin: 0;
  color: #050505;
  font-size: clamp(22px, 2.2vw, 32px);
}

.farmer-subtitle {
  margin: 4px 0 0;
  color: #8c8c8c;
  font-size: 12px;
}

.farmer-certificate {
  margin: 0 0 14px;
  padding: 18px 20px 16px;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 2px 3px #0003;
}

.farmer-certificate h2 {
  margin: 0;
  font-size: 14px;
}

.farmer-certificate p {
  margin: 6px 0 0;
  font-size: 12px;
}

.farmer-details {
  color: #858585;
}

.grading {
  color: #00715a;
}

.farmer-seal {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 42px;
  font-size: 12px;
}

.seal-badge {
  padding: 8px 7px;
  border-radius: 8px;
  background: #cee9d2;
}

.farmer-qr-panel {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #e3eee5;
}

.farmer-empty {
  padding: 16px;
}

.farmer-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid #b6d2c1;
  border-radius: 5px;
  font-size: 12px;
}

.farmer-tip i {
  color: #ffcf00;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.eyebrow {
  margin: 0 0 14px;
  color: #337659;
  font-size: 12px;
  font-weight: 600;
}

.eyebrow span {
  margin: 0 8px;
  color: #788880;
}

h1 {
  margin: 0;
  color: #111b17;
  font-size: clamp(25px, 2.3vw, 36px);
  font-weight: 700;
}

.subtitle {
  margin: 7px 0 0;
  color: #6a766e;
}

.header-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 190px;
}

.campaign {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 8px;
  background: #075344;
  color: white;
  font-size: 13px;
}

.primary-action.p-button {
  border-color: #075344;
  background: #075344;
}

.section-label {
  display: inline-block;
  margin: 27px 0 17px;
  padding: 5px 17px;
  border-radius: 13px;
  background: white;
  box-shadow: 0 2px 4px #0002;
  font-size: 18px;
  font-weight: 600;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(16px, 3vw, 46px);
  padding: 0 10px;
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 120px;
  padding: 18px 20px;
  border-radius: 12px;
  background: linear-gradient(125deg, #087b6a, #006a5e);
  color: white;
  box-shadow: 0 3px 5px #0002;
}

.kpi-card span {
  font-weight: 600;
}

.kpi-card strong {
  font-size: 19px;
}

.filters {
  margin-top: 40px;
}

.filters h2 {
  margin: 0 0 10px;
  font-size: 22px;
  text-transform: uppercase;
}

.search {
  width: min(340px, 100%);
  margin-right: auto;
}

.table-shell {
  margin-top: 12px;
  overflow: hidden;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 2px 4px #0002;
}

.table-title {
  padding: 10px 14px;
  background: #056c5c;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 8px;
  color: #69766d;
  font-size: 12px;
}

.error-banner {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid #dfb3aa;
  border-radius: 8px;
  background: #fff0ee;
  color: #9d302a;
}

.error-banner button {
  margin-left: 10px;
  border: 0;
  background: none;
  color: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.dialog-title {
  margin: 0;
  font-size: 16px;
  text-transform: uppercase;
}

.example-button {
  display: block;
  margin-top: 9px;
  border: 0;
  background: transparent;
  color: #075344;
  font-size: 12px;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}

.form-section-title {
  margin: 0 0 15px;
  color: #263b2d;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
}

.form-error {
  padding: 10px;
  border-radius: 5px;
  background: #ffe7e1;
  color: #982d22;
}

@media (max-width: 760px) {
  .page-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
    padding: 0;
  }
}
</style>

<style>
.evaluation-dialog.p-dialog { border-radius: 18px; overflow: hidden; }
.evaluation-dialog .p-dialog-header, .evaluation-dialog .p-dialog-footer { background: #f3f5f0; padding: 16px 24px; }
.evaluation-dialog .p-dialog-header { border-bottom: 1px solid #c4cec2; }
.evaluation-dialog .p-dialog-footer { border-top: 1px solid #c4cec2; }
.evaluation-dialog .p-dialog-content { padding: 24px; }
.evaluation-dialog .p-dialog-footer .p-button { border-radius: 999px; }
</style>
