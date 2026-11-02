<script>
/** Help guides shown in the help tab, in display order. */
export const GUIDE_IDS = ['plots', 'campaigns', 'expenses', 'health', 'certificates', 'offline'];
/** Frequently asked questions shown under the guides. */
export const FAQ_IDS = ['connection', 'contact', 'alerts'];
/** Route opened by each guide. */
export const GUIDE_DESTINATIONS = {
  plots: '/field-management/plots',
  campaigns: '/field-management/campaigns',
  expenses: '/field-management/finances',
  health: '/crop-health/monitoring',
  certificates: '/harvest-certification/certificates',
  offline: '/field-management/finances'
};
/** PrimeIcons class of each guide. */
export const GUIDE_ICONS = {
  plots: 'pi-map',
  campaigns: 'pi-sun',
  expenses: 'pi-wallet',
  health: 'pi-heart',
  certificates: 'pi-verified',
  offline: 'pi-sync'
};

/**
 * Removes accents and case so the guide search works with or without tildes.
 * @param {string} value - Text to normalize.
 * @returns {string} Normalized text.
 */
export const normalizeSearch = (value) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
</script>

<script setup>
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue";
import useProfilesStore from "../../application/profiles.store.js";
import useIamStore from "../../../iam/application/iam.store.js";
import {UpdateFarmerAccountCommand} from "../../domain/model/commands/update-farmer-account.command.js";

/** Account settings view for the independent farmer (segment 1). */
const { t, tm, rt, locale } = useI18n();
const toast = useToast();
const store = useProfilesStore();
const session = useIamStore();

const tab = ref('account');
const search = ref('');
const editing = ref(false);
const submitted = ref(false);
const form = ref({ firstName: '', lastName: '', phoneNumber: '', email: '' });
const languageOptions = [{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }];

const nameInvalid = (value) => !/\S/.test(value) || value.length > 100;
const errors = computed(() => ({
  firstName: nameInvalid(form.value.firstName),
  lastName: nameInvalid(form.value.lastName),
  phoneNumber: form.value.phoneNumber.length < 7,
  email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)
}));
const formInvalid = computed(() => Object.values(errors.value).some(Boolean));
const dirty = computed(() => {
  const profile = store.profile;
  return !!profile && ['firstName', 'lastName', 'phoneNumber', 'email'].some(key => form.value[key] !== profile[key]);
});

/**
 * @param {string} id - Guide.
 * @returns {string[]} Translated steps of the guide.
 */
const stepsOf = (id) => (tm(`profiles.settings.guides.${id}.steps`) ?? []).map(step => rt(step));

const filteredGuides = computed(() => {
  locale.value;
  const query = normalizeSearch(search.value.trim());
  return GUIDE_IDS.filter(id => normalizeSearch([
    t(`profiles.settings.guides.${id}.title`),
    t(`profiles.settings.guides.${id}.summary`),
    stepsOf(id).join(',')
  ].join(' ')).includes(query));
});

const resetForm = () => {
  const profile = store.profile;
  if (profile) form.value = { firstName: profile.firstName, lastName: profile.lastName, phoneNumber: profile.phoneNumber, email: profile.email };
  submitted.value = false;
};

if (session.currentUserId !== null) store.loadFarmerProfile(session.currentUserId);

watch(() => store.profile, resetForm, { immediate: true });

watch(() => store.contactSaved, saved => {
  if (!saved) return;
  editing.value = false;
  submitted.value = false;
  toast.add({ severity: 'success', summary: t('profiles.settings.saved'), life: 3000 });
});

const startEditing = () => {
  if (!store.profile || store.loading || store.saving) return;
  store.clearContactFeedback();
  editing.value = true;
};

const cancelEditing = () => {
  if (store.saving) return;
  resetForm();
  editing.value = false;
};

const saveContact = () => {
  submitted.value = true;
  if (formInvalid.value) return;
  if (!editing.value || store.saving || store.loading || !store.profile) return;
  store.saveAccount(new UpdateFarmerAccountCommand({ ...form.value }));
};
</script>

<template>
  <div class="page settings-page">
    <pv-progress-bar v-if="store.loading" mode="indeterminate" style="height: 4px" :aria-label="t('common.loading')"/>

    <header>
      <h1 class="m-0 settings-title">{{ t('profiles.settings.title') }}</h1>
      <p class="sa-muted mt-2 mb-0">{{ t('profiles.settings.subtitle') }}</p>
    </header>

    <nav class="settings-tabs" :aria-label="t('profiles.settings.title')">
      <button type="button" class="settings-tab" :class="{ active: tab === 'account' }" :aria-current="tab === 'account' ? 'page' : undefined" @click="tab = 'account'">
        <i class="pi pi-user" aria-hidden="true"/>{{ t('profiles.settings.account-tab') }}
      </button>
      <button type="button" class="settings-tab" :class="{ active: tab === 'help' }" :aria-current="tab === 'help' ? 'page' : undefined" @click="tab = 'help'">
        <i class="pi pi-question-circle" aria-hidden="true"/>{{ t('profiles.settings.help-tab') }}
      </button>
    </nav>

    <template v-if="tab === 'account'">
      <pv-card class="settings-card">
        <template #content>
          <div class="profile-summary">
            <i class="pi pi-user summary-icon" aria-hidden="true"/>
            <div class="summary-text">
              <h2>{{ t('profiles.settings.profile-title') }}</h2>
              <p v-if="store.profile?.fullName" class="profile-name">{{ store.profile.fullName }}</p>
              <p>{{ session.currentUser?.email }}</p>
              <span class="role-chip">{{ t('profiles.settings.farmer-role') }}</span>
            </div>
            <router-link :to="{ name: 'field-management-plots' }" class="p-button p-button-outlined manage-link">
              {{ t('profiles.settings.manage-plots') }}
            </router-link>
          </div>
        </template>
      </pv-card>

      <pv-message v-if="store.error" severity="error" :closable="false" role="alert">{{ store.error }}</pv-message>

      <pv-card class="settings-card">
        <template #content>
          <div class="account-grid">
            <section class="contact-section">
              <div class="section-heading">
                <h2>{{ t('profiles.settings.contact-title') }}</h2>
                <pv-button v-if="!editing" outlined icon="pi pi-pencil" :label="t('profiles.settings.edit-account')"
                           :disabled="store.loading || !store.profile" @click="startEditing"/>
              </div>
              <p class="sa-muted section-description">{{ t('profiles.settings.contact-description') }}</p>
              <form class="flex flex-column gap-3" novalidate @submit.prevent="saveContact">
                <div class="name-fields">
                  <div class="sa-field">
                    <label for="first-name">{{ t('profiles.settings.first-name') }}</label>
                    <pv-input-text id="first-name" v-model="form.firstName" autocomplete="given-name" maxlength="100"
                                   :readonly="!editing || store.saving" :invalid="submitted && errors.firstName" fluid/>
                    <small v-if="submitted && errors.firstName" class="sa-error">{{ t('profiles.settings.name-error') }}</small>
                  </div>
                  <div class="sa-field">
                    <label for="last-name">{{ t('profiles.settings.last-name') }}</label>
                    <pv-input-text id="last-name" v-model="form.lastName" autocomplete="family-name" maxlength="100"
                                   :readonly="!editing || store.saving" :invalid="submitted && errors.lastName" fluid/>
                    <small v-if="submitted && errors.lastName" class="sa-error">{{ t('profiles.settings.name-error') }}</small>
                  </div>
                </div>
                <div class="sa-field">
                  <label for="phone">{{ t('profiles.settings.phone') }}</label>
                  <pv-input-text id="phone" v-model="form.phoneNumber" type="tel" autocomplete="tel"
                                 :readonly="!editing || store.saving" :invalid="submitted && errors.phoneNumber" fluid/>
                  <small v-if="submitted && errors.phoneNumber" class="sa-error">{{ t('profiles.settings.phone-error') }}</small>
                </div>
                <div class="sa-field">
                  <label for="email">{{ t('profiles.settings.email') }}</label>
                  <pv-input-text id="email" v-model="form.email" type="email" autocomplete="email"
                                 :readonly="!editing || store.saving" :invalid="submitted && errors.email" fluid/>
                  <small v-if="submitted && errors.email" class="sa-error">{{ t('profiles.settings.email-error') }}</small>
                </div>
                <div v-if="editing" class="form-actions">
                  <pv-button type="submit" icon="pi pi-save" :loading="store.saving"
                             :label="store.saving ? t('profiles.settings.saving') : t('common.save')"
                             :disabled="store.saving || store.loading || !store.profile || !dirty"/>
                  <pv-button type="button" outlined :label="t('profiles.settings.cancel')" :disabled="store.saving" @click="cancelEditing"/>
                </div>
              </form>
            </section>

            <section class="security-section">
              <h2>{{ t('profiles.settings.security-title') }}</h2>
              <p class="sa-muted">{{ t('profiles.settings.security-description') }}</p>
              <p class="notice">{{ t('profiles.settings.preview') }}</p>
              <div><pv-button outlined icon="pi pi-lock" :label="t('profiles.settings.change-password')" disabled/></div>
              <div class="preferences">
                <h2>{{ t('profiles.settings.preferences') }}</h2>
                <div class="sa-field">
                  <label for="language">{{ t('profiles.settings.language') }}</label>
                  <pv-select v-model="locale" input-id="language" :options="languageOptions" option-label="label" option-value="value" fluid/>
                </div>
                <p class="sa-muted">{{ t('profiles.settings.language-description') }}</p>
              </div>
            </section>
          </div>
        </template>
      </pv-card>
    </template>

    <template v-else>
      <section>
        <h2>{{ t('profiles.settings.help-title') }}</h2>
        <p class="sa-muted m-0">{{ t('profiles.settings.help-description') }}</p>
      </section>

      <div class="sa-field help-search">
        <label for="help-search">{{ t('profiles.settings.search') }}</label>
        <pv-icon-field>
          <pv-input-icon class="pi pi-search"/>
          <pv-input-text id="help-search" v-model="search" fluid/>
          <pv-input-icon v-if="search" class="pi pi-times clear-search" role="button" tabindex="0"
                         :aria-label="t('profiles.settings.clear')" @click="search = ''" @keydown.enter="search = ''"/>
        </pv-icon-field>
      </div>

      <div class="guide-grid">
        <details v-for="id in filteredGuides" :key="id" class="guide">
          <summary><i :class="['pi', GUIDE_ICONS[id]]" aria-hidden="true"/>{{ t(`profiles.settings.guides.${id}.title`) }}</summary>
          <p>{{ t(`profiles.settings.guides.${id}.summary`) }}</p>
          <ol>
            <li v-for="(step, index) in stepsOf(id)" :key="index">{{ step }}</li>
          </ol>
          <router-link :to="GUIDE_DESTINATIONS[id]" class="p-button p-button-outlined">
            {{ t('profiles.settings.open-section') }}<i class="pi pi-arrow-right" aria-hidden="true"/>
          </router-link>
        </details>
        <p v-if="!filteredGuides.length" role="status">{{ t('profiles.settings.no-results') }}</p>
      </div>

      <section>
        <h2>{{ t('profiles.settings.faq-title') }}</h2>
        <details v-for="id in FAQ_IDS" :key="id" class="guide faq">
          <summary>{{ t(`profiles.settings.faq.${id}.question`) }}</summary>
          <p>{{ t(`profiles.settings.faq.${id}.answer`) }}</p>
        </details>
      </section>
    </template>
  </div>
</template>

<style scoped>
.settings-page { max-width: 960px; }
.settings-title { font-size: clamp(2rem, 4vw, 2.5rem); font-weight: 700; }
.settings-tabs { display: flex; flex-wrap: wrap; gap: 16px; }
.settings-tab { display: inline-flex; align-items: center; gap: 12px; min-width: 190px; min-height: 44px; padding: 10px 16px; border: 1px solid var(--sa-tertiary); border-radius: 5px; background: transparent; color: var(--sa-on-tertiary-fixed-variant); cursor: pointer; }
.settings-tab.active { background: color-mix(in srgb, var(--sa-tertiary-fixed-dim) 18%, transparent); }
.settings-card { overflow: hidden; border: 1px solid var(--sa-primary); border-radius: 24px; box-shadow: 0 2px 3px rgb(0 0 0 / 18%); }
.settings-card :deep(.p-card-body), .settings-card :deep(.p-card-content) { padding: 0; }
.profile-summary { display: flex; flex-wrap: wrap; align-items: center; gap: 20px; padding: 24px 32px; }
.summary-icon { font-size: 2.5rem; color: var(--sa-primary); }
.summary-text { flex: 1; min-width: 200px; }
.summary-text h2 { margin: 0 0 6px; font-size: 20px; }
.summary-text p { margin: 0 0 4px; overflow-wrap: anywhere; }
.profile-name { font-weight: 600; }
.role-chip { display: inline-block; margin-top: 4px; padding: 2px 10px; border-radius: 999px; background: color-mix(in srgb, var(--sa-primary) 14%, transparent); color: var(--sa-primary); font-size: 13px; }
.manage-link, .guide .p-button { display: inline-flex; gap: 8px; text-decoration: none; }
.account-grid { display: grid; grid-template-columns: 1fr 1fr; }
.account-grid section { padding: 32px; }
.contact-section { border-right: 1px solid var(--sa-outline-variant); }
.section-heading { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
.section-heading h2 { margin: 0; }
.section-description { margin: 12px 0 20px; }
.name-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-actions { display: flex; flex-wrap: wrap; gap: 12px; }
.security-section { display: flex; flex-direction: column; gap: 12px; }
.security-section p { margin: 0; }
.notice { padding: 10px 12px; border-radius: 8px; background: color-mix(in srgb, var(--sa-tertiary-fixed-dim) 18%, transparent); }
.preferences { margin-top: 16px; display: flex; flex-direction: column; gap: 12px; }
.preferences h2 { margin: 0; }
h2 { margin: 0 0 16px; font-size: 24px; }
.help-search { max-width: 480px; }
.clear-search { cursor: pointer; }
.guide-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; align-items: start; }
.guide { padding: 16px 20px; border: 1px solid var(--sa-outline-variant); border-radius: 12px; background: var(--sa-surface, transparent); }
.guide summary { display: flex; align-items: center; gap: 10px; font-weight: 600; cursor: pointer; }
.guide summary .pi { color: var(--sa-primary); }
.guide ol { padding-left: 20px; }
.faq { margin-bottom: 12px; }

@media (max-width: 720px) {
  .settings-tab { flex: 1 1 100%; }
  .account-grid, .name-fields { grid-template-columns: 1fr; }
  .contact-section { border-right: 0; border-bottom: 1px solid var(--sa-outline-variant); }
  .account-grid section, .profile-summary { padding: 24px; }
}
</style>
