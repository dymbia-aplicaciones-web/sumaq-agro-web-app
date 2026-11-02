<script setup>
import {onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import useProfilesStore from "../../application/profiles.store.js";
import useIamStore from "../../../iam/application/iam.store.js";
import AdvisorDialog from "../components/advisor-dialog.vue";
import ConfirmDeleteDialog from "../components/confirm-delete-dialog.vue";
import {UpdateCooperativeCommand} from "../../domain/model/commands/update-cooperative.command.js";
import {InviteTechnicalAdvisorCommand} from "../../domain/model/commands/invite-technical-advisor.command.js";
import {ReassignTechnicalAdvisorCommand} from "../../domain/model/commands/reassign-technical-advisor.command.js";

/**
 * Institutional settings of the cooperative: institutional data, technical
 * team and subscription (Angular `CooperativeSettingsView`).
 */
const { t } = useI18n();
const store = useProfilesStore();
const iamStore = useIamStore();

const tabs = ['cooperative', 'technical-team', 'subscription'];
const activeTab = ref('technical-team');
const fields = ['legalName', 'ruc', 'region', 'headquartersAddress', 'institutionalEmail', 'switchboardPhone', 'legalRepresentative'];
const form = ref(Object.fromEntries(fields.map(field => [field, ''])));
const submitted = ref(false);
const dialogVisible = ref(false);
const editedAdvisor = ref(null);
const deleteVisible = ref(false);
const advisorToRemove = ref(null);

onMounted(() => {
  if (iamStore.currentRole === 'COOPERATIVE_DIRECTOR') store.loadInstitutionalDashboard(iamStore.currentUserId);
});

watch(() => store.cooperative, cooperative => {
  if (cooperative) form.value = Object.fromEntries(fields.map(field => [field, cooperative[field]]));
}, { immediate: true });

/** @param {string} field - Field. @returns {boolean} `true` when the value breaks a rule (after submit). */
const invalid = (field) => {
  if (!submitted.value) return false;
  const value = String(form.value[field] ?? '').trim();
  if (!value) return true;
  if (field === 'ruc') return !/^\d{11}$/.test(value);
  if (field === 'institutionalEmail') return !/^\S+@\S+\.\S+$/.test(value);
  if (field === 'switchboardPhone') return value.length < 7;
  return false;
};

/** Saves the institutional data. */
const saveCooperative = () => {
  submitted.value = true;
  if (fields.some(invalid)) return;
  store.saveCooperative(new UpdateCooperativeCommand({ ...form.value }));
};

/** @param {Object|null} advisor - Advisor to edit, or `null` to invite. */
const openAdvisorDialog = (advisor) => {
  editedAdvisor.value = advisor;
  dialogVisible.value = true;
};

/** @param {Object} data - Data of the dialog. */
const onSaveAdvisor = (data) => {
  const { name, cipCode, phone, assignedPlotsCount } = data;
  if (editedAdvisor.value)
    store.reassignTechnicalAdvisor(new ReassignTechnicalAdvisorCommand(editedAdvisor.value.id, name, cipCode, phone, assignedPlotsCount));
  else if (store.cooperative)
    store.inviteTechnicalAdvisor(new InviteTechnicalAdvisorCommand(store.cooperative.id, name, cipCode, phone, assignedPlotsCount));
};

/** @param {Object} advisor - Advisor to remove. */
const confirmRemove = (advisor) => {
  advisorToRemove.value = advisor;
  deleteVisible.value = true;
};

/** Removes the advisor after the director confirmed it. */
const onConfirmRemove = () => {
  if (advisorToRemove.value) store.removeTechnicalAdvisor(advisorToRemove.value.id);
  advisorToRemove.value = null;
};
</script>

<template>
  <div class="page settings">
    <pv-progress-bar v-if="store.loading" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>

    <header class="flex flex-column gap-2">
      <p class="breadcrumb">
        {{ t('profiles.institutional.breadcrumb') }} <i class="pi pi-chevron-right text-xs" aria-hidden="true"/>
        <strong>{{ t(`profiles.institutional.tabs.${activeTab}`) }}</strong>
      </p>
      <h1>{{ t('profiles.institutional.title') }}</h1>
      <p class="sa-muted m-0">{{ t('profiles.institutional.subtitle') }}</p>
    </header>

    <nav class="settings-tabs" :aria-label="t('profiles.institutional.sections')">
      <button v-for="tab in tabs" :key="tab" type="button" class="settings-tab" :class="{ 'settings-tab--active': activeTab === tab }" @click="activeTab = tab">
        {{ t(`profiles.institutional.tabs.${tab}`) }}
      </button>
    </nav>

    <pv-card v-if="activeTab === 'cooperative' && store.cooperative" class="settings-card">
      <template #content>
        <h2>{{ t('profiles.institutional.card-title') }}</h2>
        <p class="sa-muted mt-1 mb-4">{{ t('profiles.institutional.card-description') }}</p>
        <form class="settings-form" novalidate @submit.prevent="saveCooperative">
          <div v-for="field in fields" :key="field" class="sa-field">
            <label :for="field">{{ t(`profiles.institutional.fields.${field}`) }}</label>
            <pv-input-text :id="field" v-model="form[field]" :invalid="invalid(field)" fluid/>
          </div>
          <div class="settings-form__actions">
            <pv-button type="submit" :disabled="store.saving" :label="store.saving ? t('profiles.settings.saving') : t('profiles.institutional.save')"/>
          </div>
        </form>
      </template>
    </pv-card>

    <pv-card v-if="activeTab === 'technical-team'" class="settings-card">
      <template #content>
        <div class="flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
          <div>
            <h2>{{ t('profiles.advisors.team-title') }}</h2>
            <p class="sa-muted mt-1 mb-0">{{ t('profiles.advisors.team-description') }}</p>
          </div>
          <pv-button class="btn-invite" icon="pi pi-plus" :label="t('profiles.advisors.invite')" @click="openAdvisorDialog(null)"/>
        </div>
        <pv-data-table :value="store.technicalAdvisors" data-key="id" class="advisor-table" table-style="min-width: 640px">
          <pv-column field="name" :header="t('profiles.advisors.name')" body-class="font-semibold"/>
          <pv-column :header="t('profiles.advisors.cip')">
            <template #body="{ data }">{{ data.cipCode.startsWith('CIP:') ? data.cipCode : `CIP: ${data.cipCode}` }}</template>
          </pv-column>
          <pv-column field="phone" :header="t('profiles.advisors.phone-column')"/>
          <pv-column :header="t('profiles.advisors.plots-column')">
            <template #body="{ data }">{{ t('profiles.advisors.plots-count', { count: data.assignedPlotsCount }, data.assignedPlotsCount) }}</template>
          </pv-column>
          <pv-column :header="t('profiles.advisors.actions')" header-class="text-right" body-class="text-right">
            <template #body="{ data }">
              <div class="flex justify-content-end gap-2">
                <pv-button outlined size="small" :label="t('profiles.advisors.reassign')" @click="openAdvisorDialog(data)"/>
                <pv-button outlined size="small" severity="danger" :label="t('profiles.advisors.remove')" @click="confirmRemove(data)"/>
              </div>
            </template>
          </pv-column>
          <template #empty><span class="sa-muted font-italic">{{ t('profiles.advisors.empty') }}</span></template>
        </pv-data-table>
      </template>
    </pv-card>

    <pv-card v-if="activeTab === 'subscription'" class="settings-card">
      <template #content>
        <h2>{{ t('profiles.institutional.subscription-title') }}</h2>
        <p class="sa-muted mt-1 mb-4">{{ t('profiles.institutional.subscription-description') }}</p>
        <p>{{ t('profiles.institutional.coming-soon') }}</p>
      </template>
    </pv-card>

    <p v-if="store.error" class="sa-error m-0" role="alert">{{ store.error }}</p>

    <advisor-dialog v-model:visible="dialogVisible" :advisor="editedAdvisor" @save="onSaveAdvisor"/>
    <confirm-delete-dialog v-model:visible="deleteVisible" :advisor-name="advisorToRemove?.name ?? ''" @confirm="onConfirmRemove"/>
  </div>
</template>

<style scoped>
.settings {
  max-width: 1160px;
  margin: 0 auto;
  width: 100%;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  color: var(--sa-on-surface-variant);
  font-weight: 500;
}

.breadcrumb strong {
  color: #2f8d42;
}

h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
}

h2 {
  margin: 0;
  font-size: 22px;
}

.settings-tabs {
  display: flex;
  gap: 16px;
}

.settings-tab {
  min-width: 200px;
  min-height: 48px;
  border: 1px solid var(--sa-outline-variant);
  border-radius: 12px;
  background: var(--sa-surface);
  font-weight: 500;
  cursor: pointer;
}

.settings-tab:hover:not(.settings-tab--active) {
  border-color: #2f8d42;
  background: rgba(47, 141, 66, 0.05);
}

.settings-tab--active {
  border-color: #2f8d42;
  background: #2f8d42;
  color: #fff;
  font-weight: 700;
}

.settings-card {
  border: 1px solid var(--sa-outline-variant);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.settings-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 44px;
}

.settings-form__actions {
  display: flex;
  grid-column: 1 / -1;
  justify-content: flex-end;
  margin-top: 24px;
}

.settings-form__actions :deep(.p-button) {
  background: #247a40;
  border-color: #247a40;
  text-transform: uppercase;
}

.btn-invite.p-button {
  background: #164639;
  border-color: #164639;
  border-radius: 10px;
}

.advisor-table :deep(thead th) {
  background: #006152;
  color: #fff;
}

@media (max-width: 720px) {
  .settings-tabs {
    flex-direction: column;
    gap: 8px;
  }

  .settings-tab {
    width: 100%;
  }

  .settings-form {
    grid-template-columns: 1fr;
  }
}
</style>
