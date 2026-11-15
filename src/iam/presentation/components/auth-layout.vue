<script setup>
import {useI18n} from 'vue-i18n';
import LanguageSwitcher from '../../../shared/presentation/components/language-switcher.vue';

defineProps({compact: Boolean});
const {t} = useI18n();
const images = import.meta.env.BASE_URL + 'images/';
</script>

<template>
  <div class="auth-layout" :class="{'auth-layout-compact': compact}">
    <main class="auth-main">
      <div class="auth-content">
        <header class="auth-header">
          <div class="auth-brand">
            <img class="auth-logo" :src="images + 'logo-sumaqagro.png'" alt="" width="64" height="64"/>
            <div>
              <span class="brand-name">Sumaq<span>Agro</span></span>
              <span class="brand-caption">{{ t('iam.layout.brandCaption') }}</span>
            </div>
          </div>
          <language-switcher class="auth-language"/>
        </header>
        <slot/>
        <footer class="auth-footer"><i class="pi pi-leaf" aria-hidden="true"/>{{ t('iam.layout.footer') }}</footer>
      </div>
    </main>
    <aside class="auth-visual" aria-hidden="true">
      <img class="auth-cover" :src="images + 'img-login-register.jpg'" alt=""/>
      <div class="visual-shade"/>
      <div class="visual-content">
        <span class="visual-eyebrow">{{ t('iam.layout.eyebrow') }}</span>
        <h2>{{ t('iam.layout.title') }}</h2>
        <p>{{ t('iam.layout.description') }}</p>
        <div class="visual-features">
          <span><i class="pi pi-chart-line"/>{{ t('iam.layout.monitor') }}</span>
          <span><i class="pi pi-map"/>{{ t('iam.layout.manage') }}</span>
          <span><i class="pi pi-verified"/>{{ t('iam.layout.certify') }}</span>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.auth-layout {
  display: block;
  color: #172b21;
  font-family: Poppins, Arial, sans-serif;
}
.auth-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  min-height: 100dvh;
  background: #fff;
}
.auth-main {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 40px clamp(28px, 5vw, 88px);
}
.auth-content {
  width: 100%;
  max-width: 460px;
}
.auth-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 38px;
}
.auth-language {
  flex: 0 0 132px;
  margin-inline-start: auto;
}
.auth-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.auth-logo {
  display: block;
  width: 64px;
  height: 64px;
  object-fit: contain;
  flex-shrink: 0;
}
.brand-name {
  display: block;
  font-size: 23px;
  font-weight: 700;
  letter-spacing: -1px;
}
.brand-name > span {
  color: #286643;
}
.brand-caption {
  display: block;
  margin-top: 2px;
  color: #52665a;
  font-size: 11px;
  letter-spacing: 0.04em;
}
.auth-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 30px;
  color: #52665a;
  font-size: 11px;
  line-height: 1.6;
  text-align: center;
}
.auth-footer .pi {
  width: 17px;
  height: 17px;
  font-size: 17px;
  flex-shrink: 0;
  color: #286643;
}
.auth-visual {
  position: sticky;
  top: 20px;
  align-self: start;
  height: calc(100dvh - 40px);
  min-height: 560px;
  margin: 20px 20px 20px 0;
  min-width: 0;
  overflow: hidden;
  border-radius: 28px;
  background: #123e2b;
}
.auth-cover {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.visual-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgb(18 62 43 / 12%) 20%,
    rgb(18 62 43 / 20%) 45%,
    rgb(18 62 43 / 94%) 100%
  );
}
.visual-content {
  position: absolute;
  right: 36px;
  bottom: 38px;
  left: 36px;
  color: #fff;
}
.visual-eyebrow {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.visual-content h2 {
  max-width: 470px;
  margin: 16px 0;
  font-size: clamp(28px, 3.3vw, 48px);
  font-weight: 600;
  line-height: 1.18;
  letter-spacing: -1.6px;
  text-wrap: balance;
}
.visual-content p {
  max-width: 390px;
  margin: 0;
  color: rgb(255 255 255 / 85%);
  font-size: 13px;
  line-height: 1.8;
}
.visual-features {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 28px;
  padding-top: 22px;
  border-top: 1px solid rgb(255 255 255 / 25%);
}
.visual-features > span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
}
.visual-features .pi {
  width: 18px;
  height: 18px;
  font-size: 18px;
}
.auth-layout-compact .auth-main {
  padding: 20px clamp(24px, 3vw, 56px);
}
.auth-layout-compact .auth-content {
  max-width: 560px;
}
.auth-layout-compact .auth-header {
  margin-bottom: 16px;
}
.auth-layout-compact .auth-logo {
  width: 48px;
  height: 48px;
}
.auth-layout-compact .auth-footer {
  margin-top: 16px;
}
@media (min-width: 1500px) {
  .auth-layout {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
  }
}
@media (max-width: 1100px) {
  .auth-main {
    padding: 36px 28px;
  }
  .visual-content {
    right: 26px;
    left: 26px;
  }
  .visual-features {
    gap: 12px;
  }
}
@media (max-width: 900px) {
  .auth-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .auth-main {
    padding: 36px 24px;
  }
  .auth-visual {
    display: none;
  }
}
@media (max-width: 480px) {
  .auth-main {
    align-items: flex-start;
    padding: 24px 20px;
  }
  .auth-header {
    margin-bottom: 28px;
  }
  .auth-logo {
    width: 56px;
    height: 56px;
  }
  .brand-name {
    font-size: 21px;
  }
  .auth-footer {
    margin-top: 24px;
  }
}

.auth-language { border-radius: 999px; overflow: hidden; background: #fff; }
.auth-language :deep(.p-togglebutton) { background: #fff; color: #172b21; }
.auth-language :deep(.p-togglebutton-checked) { background: #d5e7cd; }
</style>
