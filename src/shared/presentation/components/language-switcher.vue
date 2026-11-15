<script setup>
  import {useI18n} from "vue-i18n";
  const { locale, availableLocales, t } = useI18n();
</script>

<template>
  <pv-select-button v-model="locale" :options="availableLocales" :allow-empty="false" :aria-label="t('language.label')" class="language-switcher">
    <template #option="slotProps">
      <span v-tooltip.top="t(`language.${slotProps.option}`)" class="flex align-items-center gap-2">
        <i v-if="slotProps.option === locale" class="pi pi-globe" aria-hidden="true"/>
        {{ slotProps.option.toUpperCase() }}
      </span>
    </template>
  </pv-select-button>
</template>

<style scoped>
.language-switcher {
  display: flex;
  width: 100%;
  border: 1px solid #929f99;
  border-radius: 999px;
  overflow: hidden;
  background: #fff;
}

.language-switcher :deep(.p-togglebutton) {
  flex: 1 0 auto;
  justify-content: center;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #172b21;
}

.language-switcher :deep(.p-togglebutton + .p-togglebutton) {
  border-inline-start: 1px solid #929f99;
}

.language-switcher :deep(.p-togglebutton-checked) {
  background: #d5e7cd;
}

.language-switcher :deep(.p-togglebutton:focus-visible) {
  z-index: 1;
  outline: 2px solid #076600;
  outline-offset: -3px;
}
</style>
