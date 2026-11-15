<script setup>
import {computed, reactive, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute, useRouter} from 'vue-router';
import {DEMO_USERS} from '../../../iam/infrastructure/demo-session.storage.js';
import useIamStore from '../../../iam/application/iam.store.js';
import PlotAdvisorAssignment from '../components/plot-advisor-assignment.vue';
import useProfilesStore from '../../application/profiles.store.js';

const {t} = useI18n();
const route = useRoute();
const router = useRouter();
const iam = useIamStore();
const store = useProfilesStore();
const key = 'profiles.cooperative.members';
const directoryRoute = { name: 'profiles-cooperative-members' };
const registrationRoute = { name: 'profiles-cooperative-registration' };
const result = ref(null);
const status = ref('loading');
const filter = ref('all');
const query = ref(history.state?.memberSearch ?? '');
const open = ref(false);
const demoFarmers = DEMO_USERS.filter(user => user.experience === 'FARMER');
const account = ref(null);
const plotOptions = ref(null);
const supervision = ref(null);
const harvest = ref(null);
const detailsError = ref('');
const detailsBusy = ref(false);
const netWeight = computed(() => harvest.value?.batches.reduce((sum, batch) => sum + batch.netKg, 0) ?? 0);
const number = new Intl.NumberFormat();
const submitted = ref(false);
const busy = ref(false);
const error = ref('');
const form = reactive({ fullName: '', dni: '', phone: '', community: '' });
let revision = 0;

const members = computed(() => result.value?.directory ?? []);
const selected = computed(() => members.value.find(member => String(member.id) === route.params.id));
const normalize = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const visibleMembers = computed(() => {
    const search = normalize(query.value.trim());
    return members.value.filter(member =>
        (filter.value === 'all' || member.active === (filter.value === 'active')) &&
        [member.fullName, member.dni, String(member.id)].some(value => normalize(value).includes(search))
    );
});
const filters = computed(() => ['all', 'active', 'inactive'].map(value => ({
    value, label: t(key + '.' + (value === 'all' ? 'filter-all' : value))
})));
const stats = computed(() => ({
    'kpi-total': members.value.length,
    'kpi-active': members.value.filter(member => member.active).length,
    'kpi-plots': members.value.reduce((count, member) => count + member.plots.length, 0)
}));
const validName = computed(() => /\S/.test(form.fullName) && form.fullName.length <= 200);
const validDni = computed(() => /^\d{8}$/.test(form.dni));
const validPhone = computed(() => /^[+\d][\d\s()-]{6,19}$/.test(form.phone));

async function load() {
    const request = ++revision;
    result.value = null;
    status.value = 'loading';
    if (iam.currentRole !== 'COOPERATIVE_DIRECTOR') return;
    try {
        const loaded = await store.loadMemberDirectory(iam.currentUserId);
        if (request !== revision) return;
        result.value = loaded;
        status.value = loaded ? 'ready' : 'missing';
    } catch {
        if (request === revision) status.value = 'error';
    }
}

watch(() => iam.currentUser, () => {
    open.value = false;
    void load();
}, { immediate: true });
watch(() => route.params.id, () => { open.value = false; });
watch(selected, async (member, _, onCleanup) => {
    let current = true;
    onCleanup(() => { current = false; });
    harvest.value = null;
    supervision.value = null;
    detailsError.value = '';
    plotOptions.value = null;
    account.value = null;
    if (!member) return;
    const requests = await Promise.allSettled([
        store.loadMemberHarvest(member),
        store.loadPlotSupervision(result.value.organization, member.plots)
    ]);
    if (!current) return;
    const [collection, advisors] = requests;
    if (collection.status === 'fulfilled') harvest.value = collection.value;
    if (advisors.status === 'fulfilled') supervision.value = advisors.value;
    if (requests.some(request => request.status === 'rejected')) detailsError.value = key + '.error';
});

async function runDetail(action, errorKey, refresh = true) {
    if (detailsBusy.value || !selected.value) return;
    const member = selected.value;
    detailsBusy.value = true;
    detailsError.value = '';
    try {
        const value = await action(member, result.value.organization);
        if (selected.value !== member) return;
        if (refresh) await load();
        else plotOptions.value = value;
    } catch {
        if (selected.value === member) detailsError.value = errorKey;
    } finally {
        detailsBusy.value = false;
    }
}

function updateSupervision(plotId, advisorId) {
    return runDetail(
        (member, organization) => store.supervisePlot(organization, member.id, plotId, advisorId),
        'profiles.advisory.errors.save'
    );
}

watch(query, value => history.replaceState({ ...history.state, memberSearch: value }, ''));

function start(member) {
    Object.assign(form, {
        fullName: member?.fullName ?? '', dni: member?.dni ?? '',
        phone: member?.phone ?? '', community: member?.community ?? ''
    });
    submitted.value = false;
    error.value = '';
    open.value = true;
}

function memberRoute(id) {
    return { name: 'profiles-cooperative-member', params: { id }, state: { memberSearch: query.value } };
}

async function save() {
    submitted.value = true;
    if (busy.value || !result.value || !validName.value || !validDni.value ||
        !validPhone.value || form.community.length > 100) return;
    const id = selected.value?.id;
    const director = iam.currentUser;
    busy.value = true;
    error.value = '';
    try {
        const saved = await store.saveMember(result.value.organization, {
            fullName: form.fullName.trim(), dni: form.dni,
            phone: form.phone.trim(), community: form.community.trim()
        }, id);
        if (director !== iam.currentUser) return;
        open.value = false;
        await load();
        if (id == null) await router.push(memberRoute(saved.id));
    } catch (cause) {
        if (director === iam.currentUser)
            error.value = cause.message === key + '.duplicate' ? cause.message : key + '.save-error';
    } finally {
        busy.value = false;
    }
}
</script>

<template>
  <section class="p-4 flex flex-column gap-3">
    <router-link v-if="route.params.id" :to="{ ...directoryRoute, state: { memberSearch: query } }">
      {{ t(key + '.back') }}
    </router-link>
    <h1>{{ t(key + (route.params.id ? '.dossier' : '.title')) }}</h1>

    <pv-progress-bar v-if="status === 'loading'" mode="indeterminate" :aria-label="t('common.loading')"/>
    <template v-else-if="status === 'error'">
      <pv-message severity="error">{{ t(key + '.error') }}</pv-message>
      <pv-button :label="t('common.retry')" @click="load"/>
    </template>
    <template v-else-if="status === 'missing'">
      <pv-message severity="info">{{ t('profiles.cooperative.dashboard.no-cooperative-message') }}</pv-message>
      <router-link :to="registrationRoute">{{ t('profiles.cooperative.registration.title') }}</router-link>
    </template>
    <template v-else-if="route.params.id">
      <pv-message v-if="!selected" severity="warn">{{ t(key + '.not-found') }}</pv-message>
      <pv-card v-else>
        <template #title>{{ selected.fullName }}</template>
        <template #content>
          <pv-tag :severity="selected.active ? 'success' : 'secondary'" :value="t(key + (selected.active ? '.active' : '.inactive'))"/>
          <dl>
            <dt>DNI</dt><dd>{{ selected.dni || '—' }}</dd>
            <dt>{{ t(key + '.phone') }}</dt><dd>{{ selected.phone || '—' }}</dd>
            <dt>{{ t(key + '.community') }}</dt><dd>{{ selected.community || '—' }}</dd>
          </dl>
          <pv-button outlined icon="pi pi-pencil" :label="t(key + '.edit')" @click="start(selected)"/>
          <div v-if="selected.active && !selected.userId && demoFarmers.length" class="flex flex-wrap gap-2 mt-3">
            <pv-select v-model="account" :options="demoFarmers" option-label="displayName" option-value="id"
                       :placeholder="t(key + '.demo-account')" :aria-label="t(key + '.demo-account')"/>
            <pv-button :disabled="!account || detailsBusy" :label="t(key + '.link-account')"
                       @click="runDetail((member, organization) => store.linkMemberAccount(organization, member.id, account), key + '.link-account-error')"/>
          </div>
          <h2>{{ t(key + '.plots') }}</h2>
          <p v-if="!selected.userId">{{ t(key + '.link-account-first') }}</p>
          <pv-button v-else :disabled="detailsBusy" :label="t(key + '.link-plot')"
                     @click="runDetail(member => store.linkablePlots(member), key + '.link-error', false)"/>
          <p v-if="plotOptions && !plotOptions.length">{{ t(key + '.no-linkable-plots') }}</p>
          <div v-if="plotOptions?.length" class="flex flex-wrap gap-2">
            <pv-button v-for="plot in plotOptions" :key="plot.id" outlined :disabled="detailsBusy" :label="plot.name"
                       @click="runDetail((member, organization) => store.linkMemberPlot(organization, member.id, plot.id), key + '.link-error')"/>
          </div>
          <p v-if="!selected.plots.length">{{ t(key + '.no-plots') }}</p>
          <ul v-else>
            <li v-for="(plot, index) in selected.plots" :key="plot.id">
              {{ plot.name }} · {{ plot.region }} · {{ plot.coordinates }} · {{ plot.variety }}
              <plot-advisor-assignment v-if="supervision && selected.userId"
                                       :team="supervision.team" :assignment="supervision.assignments[index]"
                                       :busy="detailsBusy" @change="updateSupervision(plot.id, $event)"/>
            </li>
          </ul>
          <pv-message v-if="detailsError" severity="error">{{ t(detailsError) }}</pv-message>
          <template v-if="harvest">
            <h2>{{ t(key + '.collection') }}</h2>
            <p v-if="!harvest.batches.length">{{ t(key + '.no-collection') }}</p>
            <template v-else>
              <p>{{ t(key + '.net-total') }} {{ number.format(netWeight) }} kg</p>
              <pv-data-table :value="harvest.batches" data-key="id">
                <pv-column field="code"/>
                <pv-column field="plotName" :header="t(key + '.plots')"/>
                <pv-column field="collectedAt"/>
                <pv-column :header="t(key + '.net-weight')">
                  <template #body="{data}">{{ number.format(data.netKg) }} kg</template>
                </pv-column>
              </pv-data-table>
            </template>
            <h2>{{ t(key + '.certificates') }}</h2>
            <p v-if="!harvest.certificates.length">{{ t(key + '.no-certificates') }}</p>
            <ul v-else>
              <li v-for="certificate in harvest.certificates" :key="certificate.id">
                {{ certificate.certificateNumber }} · {{ certificate.issuedAt }} · {{ t(key + '.certificate-' + certificate.status) }}
                <router-link :to="{ name: 'public-traceability', params: { token: certificate.verificationToken } }">
                  {{ t(key + '.verify-certificate') }}
                </router-link>
              </li>
            </ul>
          </template>
        </template>
      </pv-card>
    </template>
    <template v-else>
      <p>{{ t(key + '.subtitle') }}</p>
      <div v-if="members.length" class="flex flex-wrap gap-3">
        <pv-card v-for="(count, label) in stats" :key="label">
          <template #title>{{ count }}</template>
          <template #content>{{ t(key + '.' + label) }}</template>
        </pv-card>
      </div>
      <div class="flex flex-wrap gap-2">
        <pv-input-text v-model="query" type="search" :placeholder="t(key + '.search')" :aria-label="t(key + '.search')"/>
        <pv-select v-model="filter" :options="filters" option-label="label" option-value="value" :aria-label="t(key + '.filter-status')"/>
        <pv-button icon="pi pi-plus" :label="t(key + '.add')" @click="start()"/>
      </div>
      <pv-data-table :value="visibleMembers" data-key="id" paginator :rows="10">
        <template #empty>{{ t(key + (members.length ? '.no-results' : '.empty')) }}</template>
        <pv-column field="fullName" :header="t(key + '.name')"/>
        <pv-column field="dni" header="DNI"/>
        <pv-column field="phone" :header="t(key + '.phone')"/>
        <pv-column :header="t(key + '.status')">
          <template #body="{data}">
            <pv-tag :severity="data.active ? 'success' : 'secondary'" :value="t(key + (data.active ? '.active' : '.inactive'))"/>
          </template>
        </pv-column>
        <pv-column :header="t(key + '.plots')">
          <template #body="{data}">{{ data.plots.length }}</template>
        </pv-column>
        <pv-column>
          <template #body="{data}"><router-link :to="memberRoute(data.id)">{{ t(key + '.view') }}</router-link></template>
        </pv-column>
      </pv-data-table>
    </template>

    <pv-dialog v-model:visible="open" modal :closable="!busy" :dismissable-mask="false"
               :header="t(key + (selected ? '.edit' : '.new-title'))">
      <form class="flex flex-column gap-2" novalidate @submit.prevent="save">
        <label for="member-name">{{ t(key + '.name') }}</label>
        <pv-input-text id="member-name" v-model="form.fullName" maxlength="200" required/>
        <small v-if="submitted && !validName">{{ t(key + '.error-name') }}</small>
        <label for="member-dni">DNI</label>
        <pv-input-text id="member-dni" v-model="form.dni" inputmode="numeric" maxlength="8" required/>
        <small v-if="submitted && !validDni">{{ t(key + '.error-dni') }}</small>
        <label for="member-phone">{{ t(key + '.phone') }}</label>
        <pv-input-text id="member-phone" v-model="form.phone" type="tel" maxlength="20" required/>
        <small v-if="submitted && !validPhone">{{ t(key + '.error-phone') }}</small>
        <label for="member-community">{{ t(key + '.community') }}</label>
        <pv-input-text id="member-community" v-model="form.community" maxlength="100"/>
        <pv-message v-if="error" severity="error">{{ t(error) }}</pv-message>
        <div class="flex justify-content-end gap-2 mt-2">
          <pv-button outlined :label="t('common.cancel')" :disabled="busy" @click="open = false"/>
          <pv-button type="submit" :label="t(key + '.save')" :loading="busy"/>
        </div>
      </form>
    </pv-dialog>
  </section>
</template>
