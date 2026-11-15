<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {formatDate, formatNumber} from "../../../shared/presentation/format.js";

/** Technical certificate with its QR (preview or issued), as in the Angular modal. */
const props = defineProps({
  batch: { type: Object, required: true },
  /** Issued certificate, or `null` for the preview. */
  certificate: { type: Object, default: null },
  /** Draft of the preview (hash, token, issue date). */
  draft: { type: Object, default: null }
});
const { t, locale } = useI18n();

const verificationUrl = computed(() => {
  const certificate = props.certificate;
  return certificate?.sha256Hash
    ? `${window.location.origin}/verify/${encodeURIComponent(certificate.certificateNumber)}?hash=${encodeURIComponent(certificate.sha256Hash)}`
    : '';
});
const qrImageUrl = computed(() => `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl.value)}`);
const dateTime = value => formatDate(value, locale.value, { dateStyle: 'short', timeStyle: 'short' });
</script>

<template>
  <div class="certificate" id="print-certificate">
    <div class="certificate-title">SUMAQAGRO CERTIFICATE ENGINE <span>|</span> {{ t('harvest-certification.certificate.technical-document') }}</div>
    <div class="certificate-body">
      <div class="certificate-facts">
        <div>
          <strong>{{ t('harvest-certification.certificate.producer') }}:</strong> {{ batch.memberName }}<br/>
          <strong>{{ t('harvest-certification.certificate.plot') }}:</strong> {{ batch.plotName }} · {{ batch.plotRegion }}<br/>
          <strong>{{ t('harvest-certification.certificate.gps') }}:</strong> {{ batch.coordinates }}
        </div>
        <div>
          <strong>{{ t('harvest-certification.certificate.product') }}:</strong> {{ batch.variety }} ·
          <strong>{{ t('harvest-certification.certificate.volume') }}:</strong> {{ formatNumber(batch.netKg, locale) }} {{ t('harvest-certification.certificate.net-kg') }}<br/>
          <strong>{{ t('harvest-certification.certificate.quality') }}:</strong> {{ t(`harvest-certification.quality-category.${batch.qualityCategory}`) }}<br/>
          <template v-if="batch.potatoGrading">
            {{ t('harvest-certification.certificate.first') }}: {{ batch.potatoGrading.firstPercentage }} % ·
            {{ t('harvest-certification.certificate.second') }}: {{ batch.potatoGrading.secondPercentage }} % ·
            {{ t('harvest-certification.certificate.loss') }}: {{ batch.potatoGrading.thirdPercentage }} %
          </template>
          <template v-else>{{ t('harvest-certification.certificate.sca-score') }}: {{ batch.coffeeCupping?.totalScore }}</template>
        </div>
        <div v-if="certificate">
          <template v-if="certificate.isDemo()"><strong>{{ t('harvest-certification.certificate.demo-record') }}</strong><br/></template>
          <template v-else><strong>{{ t('harvest-certification.certificate.hash') }}:</strong> {{ certificate.sha256Hash.slice(0, 18) }}…<br/></template>
          <strong>{{ t('harvest-certification.certificate.issued-by') }}:</strong> {{ certificate.issuedByName }}<br/>
          <strong>{{ t('harvest-certification.certificate.date') }}:</strong> {{ dateTime(certificate.issuedAt) }}
        </div>
        <div v-else-if="draft">
          <strong>{{ t('harvest-certification.certificate.expected-issuer') }}:</strong> {{ draft.issuerName }}<br/>
          <strong>{{ t('harvest-certification.certificate.preview-date') }}:</strong> {{ dateTime(draft.issuedAt) }}
        </div>
      </div>
      <div class="qr-panel">
        <template v-if="verificationUrl">
          <img :src="qrImageUrl" width="120" height="120" :alt="t('harvest-certification.certificate.qr-alt')"/>
          <a v-if="certificate" :href="verificationUrl" target="_blank" rel="noopener">{{ t('harvest-certification.certificate.verify') }}</a>
          <span v-else>{{ t('harvest-certification.certificate.link-pending') }}</span>
        </template>
        <template v-else>
          <i class="pi pi-qrcode qr-icon" aria-hidden="true"/>
          <span>{{ t('harvest-certification.certificate.qr-pending') }}</span>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.certificate {
  overflow: hidden;
  border: 2px solid #168edf;
  border-radius: 9px;
  background: white;
}

.certificate-title {
  padding: 7px 15px;
  background: #164d37;
  color: white;
  font-size: 13px;
  font-weight: 700;
}

.certificate-title span {
  margin: 0 5px;
}

.certificate-body {
  display: grid;
  grid-template-columns: 1fr 150px;
  gap: 18px;
  padding: 15px;
}

.certificate-facts {
  display: grid;
  gap: 8px;
}

.certificate-facts > div {
  padding: 11px;
  border-radius: 7px;
  background: #a1e8b8;
  font-size: 12px;
  line-height: 1.65;
  overflow-wrap: anywhere;
}

.qr-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 11px;
  text-align: center;
}

.qr-panel a {
  color: #075344;
  overflow-wrap: anywhere;
}

.qr-icon {
  font-size: 5rem;
}

@media (max-width: 760px) {
  .certificate-body {
    grid-template-columns: 1fr;
  }
}
</style>
