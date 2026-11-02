<script setup>
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import useIamStore from "../../../iam/application/iam.store.js";
import useFarmerAdvisoryStore from "../../application/farmer-advisory.store.js";

/** Farmer-controlled demo responsibility selector, shared by plot detail and advisory inbox (Angular `FarmerAdvisoryPanel`). */
const props = defineProps({
  /** Plot whose responsible advisor is shown. */
  plotId: { type: Number, required: true }
});
const { t } = useI18n();
const store = useFarmerAdvisoryStore();
const session = useIamStore();

const advisor = computed(() => store.advisorFor(props.plotId));
const assignment = computed(() => store.assignmentFor(props.plotId));
const advisorOptions = computed(() => store.advisors.map(item => ({ value: item.userId, label: `${item.name} · CIP ${item.cipCode}` })));
const selected = ref(null);
const confirming = ref(false);
const saved = ref(false);

watch(assignment, current => {
  selected.value = current?.advisorUserId ?? null;
  confirming.value = false;
}, { immediate: true });

watch([() => session.currentUser, () => props.plotId], () => {
  saved.value = false;
  confirming.value = false;
});

/** @param {number} advisorUserId - Professional chosen in the select. */
const onSelect = (advisorUserId) => {
  selected.value = advisorUserId;
  confirming.value = false;
  saved.value = false;
};

/** Persists only after explicit confirmation; success is displayed after the API reply. */
const save = () => {
  const advisorUserId = selected.value;
  if (!confirming.value || advisorUserId === null) return;
  store.assign(props.plotId, advisorUserId, () => {
    confirming.value = false;
    saved.value = true;
  });
};
</script>

<template>
  <pv-card class="advisory-panel sa-card">
    <template #title>{{ t('profiles.advisory.title') }}</template>
    <template #content>
      <div class="panel-body">
        <pv-progress-bar v-if="store.loading || store.saving" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>
        <template v-if="store.error">
          <p class="sa-error" role="alert">{{ t(store.error) }}</p>
          <div><pv-button text :label="t('common.retry')" :disabled="store.saving" @click="store.reload()"/></div>
        </template>
        <template v-if="!store.loading">
          <template v-if="advisor">
            <p><strong>{{ advisor.name }}</strong> · CIP {{ advisor.cipCode }}</p>
            <p>{{ advisor.phone }}</p>
          </template>
          <p v-else-if="assignment">{{ t('profiles.advisory.unavailable') }}</p>
          <p v-else>{{ t('profiles.advisory.unassigned') }}</p>
          <p class="sa-muted">{{ t('profiles.advisory.demo-notice') }}</p>

          <template v-if="store.advisors.length">
            <div class="sa-field advisor-select">
              <label :for="`advisor-select-${plotId}`">{{ t('profiles.advisory.select') }}</label>
              <pv-select :model-value="selected" :input-id="`advisor-select-${plotId}`" :options="advisorOptions"
                         option-label="label" option-value="value" :disabled="!store.canAssign(plotId)" fluid
                         @update:model-value="onSelect"/>
            </div>
            <template v-if="confirming">
              <p role="status">{{ t('profiles.advisory.confirm') }}</p>
              <div class="actions">
                <pv-button :label="t('profiles.advisory.confirm-button')" :disabled="!store.canAssign(plotId)" @click="save"/>
                <pv-button text :label="t('crop-health.cancel')" :disabled="store.saving" @click="confirming = false"/>
              </div>
            </template>
            <div v-else class="actions">
              <pv-button outlined :label="t('profiles.advisory.assign')"
                         :disabled="!store.canAssign(plotId) || selected === null || selected === assignment?.advisorUserId"
                         @click="confirming = true; saved = false"/>
            </div>
          </template>
          <p v-else-if="!store.error">{{ t('profiles.advisory.no-advisors') }}</p>
        </template>
        <p v-if="saved" role="status">{{ t('profiles.advisory.saved') }}</p>
      </div>
    </template>
  </pv-card>
</template>

<style scoped>
.advisory-panel {
  min-width: 0;
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

p {
  margin: 0;
  overflow-wrap: anywhere;
}

.advisor-select {
  width: 100%;
  max-width: 440px;
}
</style>
