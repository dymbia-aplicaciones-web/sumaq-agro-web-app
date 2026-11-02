<script setup>
import {useI18n} from "vue-i18n";

/** Confirms the removal of a technical advisor from the team (Angular `ConfirmDeleteDialog`). */
defineProps({
  /** Name of the advisor to remove. */
  advisorName: { type: String, required: true }
});
const visible = defineModel('visible', { type: Boolean, required: true });
/** `confirm`: the director confirmed the removal. */
const emit = defineEmits(['confirm']);
const { t } = useI18n();

const onConfirm = () => {
  visible.value = false;
  emit('confirm');
};
</script>

<template>
  <pv-dialog v-model:visible="visible" modal :header="t('profiles.advisors.remove-title')" :style="{ width: '440px', maxWidth: 'calc(100vw - 32px)' }">
    <p class="mt-0">{{ t('profiles.advisors.remove-message', { name: advisorName }) }}</p>
    <template #footer>
      <pv-button text :label="t('common.cancel')" @click="visible = false"/>
      <pv-button severity="danger" :label="t('profiles.advisors.remove')" @click="onConfirm"/>
    </template>
  </pv-dialog>
</template>
