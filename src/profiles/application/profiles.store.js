import {PlotAdvisorAssignmentsApi} from '../infrastructure/plot-advisor-assignments.api.js';
import {FieldManagementApi} from '../../field-management/infrastructure/field-management-api.js';
import {HarvestCertificationApi} from '../../harvest-certification/infrastructure/harvest-certification-api.js';
import {HarvestBatchAssembler} from '../../harvest-certification/infrastructure/harvest-batch.assembler.js';
import {QualityCertificateAssembler} from '../../harvest-certification/infrastructure/quality-certificate.assembler.js';
import {DEMO_USERS} from '../../iam/infrastructure/demo-session.storage.js';
import useIamStore from "../../iam/application/iam.store.js";
/**
 * Application service store for the Profiles bounded context (Angular `ProfilesStore`).
 * It coordinates the farmer profile and the institutional Profile read models
 * for a cooperative director.
 *
 * @module useProfilesStore
 */
import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {ProfilesApi} from "../infrastructure/profiles-api.js";
import {UpdateFarmerAccountCommand} from "../domain/model/commands/update-farmer-account.command.js";
import {FarmerProfile} from "../domain/model/entities/farmer-profile.entity.js";
import {TechnicalAdvisor} from "../domain/model/entities/technical-advisor.entity.js";

const profilesApi = new ProfilesApi();
const assignmentsApi = new PlotAdvisorAssignmentsApi();
const fieldsApi = new FieldManagementApi();
const harvestApi = new HarvestCertificationApi();

/**
 * Reactive store that exposes Profiles commands and queries.
 *
 * @returns {Object} Store state and actions.
 */
const useProfilesStore = defineStore('profiles', () => {
    /** @type {import('vue').Ref<FarmerProfile|null>} */
    const profile = ref(null);
    /** @type {import('vue').Ref<import('../domain/model/entities/cooperative.entity.js').Cooperative|null>} */
    const cooperative = ref(null);
    /** @type {import('vue').Ref<import('../domain/model/entities/cooperative-member.entity.js').CooperativeMember[]>} */
    const members = ref([]);
    /** @type {import('vue').Ref<TechnicalAdvisor[]>} */
    const technicalAdvisors = ref([]);
    /** @type {import('vue').Ref<import('../domain/model/entities/cooperative-dashboard.entity.js').CooperativeDashboard|null>} */
    const dashboard = ref(null);
    const loading = ref(false);
    const saving = ref(false);
    /** @type {import('vue').Ref<string|null>} Message of the last error. */
    const error = ref(null);
    /** `true` after the farmer's account data was saved. */
    const contactSaved = ref(false);

    /** Number of active members of the cooperative. */
    const activeMemberCount = computed(() => members.value.filter(member => member.active).length);

    function clearContactFeedback() {
        contactSaved.value = false;
        error.value = null;
    }

    /**
     * Loads the personal contact profile of the independent farmer.
     * @param {number} userId - Farmer.
     */
    function loadFarmerProfile(userId) {
        contactSaved.value = false;
        profile.value = null;
        loading.value = true;
        error.value = null;
        profilesApi.getFarmerProfile(userId)
            .then(loaded => profile.value = loaded)
            .catch(cause => error.value = cause.message)
            .finally(() => loading.value = false);
    }

    /**
     * Validates and persists the farmer's contact data.
     * @param {import('../domain/model/commands/update-farmer-contact.command.js').UpdateFarmerContactCommand} command - Phone and email.
     */
    function saveContact(command) {
        persistFarmerProfile(command);
    }

    /**
     * Validates and persists the farmer's names and contact data.
     * @param {UpdateFarmerAccountCommand} command - Names, phone and email.
     */
    function saveAccount(command) {
        persistFarmerProfile(command);
    }

    function persistFarmerProfile(command) {
        contactSaved.value = false;
        const current = profile.value;
        if (!current || saving.value) return;
        let updated;
        try {
            updated = new FarmerProfile({
                id: current.id,
                userId: current.userId,
                firstName: current.firstName,
                lastName: current.lastName,
                phoneNumber: current.phoneNumber,
                email: current.email
            });
            updated.updateContact(command.phoneNumber, command.email);
            if (command instanceof UpdateFarmerAccountCommand) updated.updateName(command.firstName, command.lastName);
        } catch (cause) {
            error.value = cause instanceof Error ? cause.message : 'Invalid contact data.';
            return;
        }
        saving.value = true;
        error.value = null;
        profilesApi.updateFarmerProfile(updated)
            .then(saved => {
                profile.value = saved;
                contactSaved.value = true;
            })
            .catch(cause => error.value = cause.message)
            .finally(() => saving.value = false);
    }

    /**
     * Loads the role-specific read model for the active cooperative director.
     * @param {number} directorUserId - Director.
     */
    async function loadCooperativeDashboard(directorUserId) {
        const director = iam.currentUser;
        dashboard.value = null;
        cooperative.value = null;
        loading.value = true;
        error.value = null;
        try {
            const organization = await profilesApi.getCooperativeByDirector(directorUserId);
            if (iam.currentUser !== director) return;
            cooperative.value = organization;
            if (!organization) return;
            const loaded = await profilesApi.getInstitutionalDashboard(directorUserId);
            if (iam.currentUser === director) dashboard.value = loaded;
        } catch (cause) {
            if (iam.currentUser === director) error.value = cause.message;
        } finally {
            if (iam.currentUser === director) loading.value = false;
        }
    }

    /**
     * Loads the cooperative, member summary, and technical team for the active director.
     * @param {number} directorUserId - Director.
     */
    function loadInstitutionalDashboard(directorUserId) {
        loading.value = true;
        error.value = null;
        profilesApi.getCooperativeByDirector(directorUserId)
            .then(found => {
                cooperative.value = found;
                if (!found) return { loadedMembers: [], advisors: [] };
                return profilesApi.getCooperativeMembers(found.id)
                    .then(loadedMembers => profilesApi.getTechnicalAdvisors(found.id)
                        .then(advisors => ({ loadedMembers, advisors })));
            })
            .then(({ loadedMembers, advisors }) => {
                members.value = loadedMembers;
                technicalAdvisors.value = advisors;
            })
            .catch(cause => error.value = cause.message)
            .finally(() => loading.value = false);
    }

    /**
     * Loads technical advisors specifically for a cooperative.
     * @param {number} cooperativeId - Cooperative.
     */
    function loadTechnicalAdvisors(cooperativeId) {
        loading.value = true;
        error.value = null;
        profilesApi.getTechnicalAdvisors(cooperativeId)
            .then(advisors => technicalAdvisors.value = advisors)
            .catch(cause => error.value = cause.message)
            .finally(() => loading.value = false);
    }

    /**
     * Validates and persists the director's institutional configuration.
     * @param {import('../domain/model/commands/update-cooperative.command.js').UpdateCooperativeCommand} command - Institutional data.
     */
    function saveCooperative(command) {
        const current = cooperative.value;
        if (!current) return;
        try {
            current.updateInstitutionalData(command);
        } catch (cause) {
            error.value = cause instanceof Error ? cause.message : 'Invalid institutional data.';
            return;
        }
        saving.value = true;
        error.value = null;
        profilesApi.updateCooperative(current)
            .then(saved => cooperative.value = saved)
            .catch(cause => error.value = cause.message)
            .finally(() => saving.value = false);
    }

    /**
     * Invites a new technical advisor to the cooperative team.
     * @param {import('../domain/model/commands/invite-technical-advisor.command.js').InviteTechnicalAdvisorCommand} command - Advisor data.
     */
    function inviteTechnicalAdvisor(command) {
        const newAdvisor = new TechnicalAdvisor({
            cooperativeId: command.cooperativeId,
            name: command.name,
            cipCode: command.cipCode,
            phone: command.phone,
            assignedPlotsCount: command.assignedPlotsCount
        });
        saving.value = true;
        error.value = null;
        profilesApi.createTechnicalAdvisor(newAdvisor)
            .then(created => technicalAdvisors.value = [...technicalAdvisors.value, created])
            .catch(cause => error.value = cause.message)
            .finally(() => saving.value = false);
    }

    /**
     * Reassigns or edits details for an existing technical advisor.
     * @param {import('../domain/model/commands/reassign-technical-advisor.command.js').ReassignTechnicalAdvisorCommand} command - New data.
     */
    function reassignTechnicalAdvisor(command) {
        const advisor = technicalAdvisors.value.find(item => item.id === command.id);
        if (!advisor) return;
        try {
            advisor.updateDetails(command.name, command.cipCode, command.phone, command.assignedPlotsCount);
        } catch (cause) {
            error.value = cause instanceof Error ? cause.message : 'Datos inválidos.';
            return;
        }
        saving.value = true;
        error.value = null;
        profilesApi.updateTechnicalAdvisor(advisor)
            .then(updated => technicalAdvisors.value = technicalAdvisors.value.map(item => item.id === updated.id ? updated : item))
            .catch(cause => error.value = cause.message)
            .finally(() => saving.value = false);
    }

    /**
     * Removes a technical advisor from the cooperative team.
     * @param {number} id - Advisor record.
     */
    function removeTechnicalAdvisor(id) {
        saving.value = true;
        error.value = null;
        profilesApi.deleteTechnicalAdvisor(id)
            .then(() => technicalAdvisors.value = technicalAdvisors.value.filter(item => item.id !== id))
            .catch(cause => error.value = cause.message)
            .finally(() => saving.value = false);
    }

    const iam = useIamStore();

    async function registerCooperative(details) {
        const director = iam.currentUser;
        const key = 'profiles.cooperative.registration';
        if (director?.experience !== 'COOPERATIVE_DIRECTOR' || saving.value) return false;
        saving.value = true;
        try {
            const existing = await profilesApi.getCooperativeByDirector(director.id);
            if (iam.currentUser !== director) return false;
            if (existing) throw new Error(key + '.existing');
            const registered = await profilesApi.registerCooperative(director.id, details);
            if (iam.currentUser !== director) return false;
            cooperative.value = registered;
            return true;
        } catch (cause) {
            if (iam.currentUser !== director) return false;
            throw new Error(cause.message === key + '.existing' ? cause.message : key + '.error');
        } finally {
            saving.value = false;
        }
    }

    async function loadMemberDirectory(directorId) {
        const organization = await profilesApi.getCooperativeByDirector(directorId);
        if (!organization) return null;
        const directory = await profilesApi.getCooperativeMembers(organization.id);
        return { organization, directory };
    }

    async function saveMember(organization, details, id) {
        const director = iam.currentUser;
        const key = 'profiles.cooperative.members';
        if (director?.experience !== 'COOPERATIVE_DIRECTOR' ||
            director.id !== organization.directorUserId) throw new Error(key + '.save-error');

        const directory = await profilesApi.getCooperativeMembers(organization.id);
        if (iam.currentUser !== director || (id != null && !directory.some(member => member.id === id)))
            throw new Error(key + '.save-error');
        if (directory.some(member => member.dni === details.dni && member.id !== id))
            throw new Error(key + '.duplicate');

        return id == null
            ? profilesApi.addCooperativeMember(organization.id, details)
            : profilesApi.updateCooperativeMember(id, details);
    }

    async function readMember(organization, id) {
        const director = iam.currentUser;
        const denied = () => new Error('profiles.advisory.errors.denied');
        if (director?.experience !== 'COOPERATIVE_DIRECTOR' || director.id !== organization.directorUserId)
            throw denied();
        const directory = await profilesApi.getCooperativeMembers(organization.id);
        const member = directory.find(item => item.id === id);
        const checkSession = () => {
            if (iam.currentUser !== director || !member) throw denied();
        };
        checkSession();
        return { member, directory, checkSession };
    }

    async function linkMemberAccount(organization, id, userId) {
        const { member, directory } = await readMember(organization, id);
        if (!member.active || member.userId || directory.some(item => item.userId === userId) ||
            !DEMO_USERS.some(user => user.id === userId && user.experience === 'FARMER'))
            throw new Error('profiles.cooperative.members.link-account-error');
        return profilesApi.linkMemberAccount(id, userId);
    }

    async function linkablePlots(member) {
        if (!member.userId) return [];
        const plots = await fieldsApi.getPlotsByOwner(member.userId);
        return plots.filter(plot => plot.hasPolygon() && !member.plots.some(item => item.id === plot.id));
    }

    async function linkMemberPlot(organization, id, plotId) {
        const { member, checkSession } = await readMember(organization, id);
        const plot = (await linkablePlots(member)).find(item => item.id === plotId);
        if (!plot) throw new Error('profiles.cooperative.members.link-error');
        const campaigns = await fieldsApi.getCampaignsByPlot(plotId);
        const campaign = campaigns.find(item => item.isActive());
        if (!campaign || !['ANDEAN_POTATO', 'SPECIALTY_COFFEE'].includes(campaign.cropType))
            throw new Error('profiles.cooperative.members.link-error');
        const { latitude, longitude } = plot.boundary[0];
        checkSession();
        return profilesApi.linkMemberPlot(member, {
            id: plot.id, name: plot.name, region: plot.region,
            coordinates: latitude + ', ' + longitude, campaignId: campaign.id,
            variety: campaign.seedVariety, cropType: campaign.cropType
        });
    }

    async function loadMemberHarvest(member) {
        const [batchesResponse, certificatesResponse] = await Promise.all([
            harvestApi.getBatchesByCooperative(member.cooperativeId), harvestApi.getCertificates()
        ]);
        const batches = HarvestBatchAssembler.toEntitiesFromResponse(batchesResponse)
            .filter(batch => batch.cooperativeId === member.cooperativeId && batch.memberId === member.id)
            .sort((a, b) => b.collectedAt.localeCompare(a.collectedAt));
        const batchIds = new Set(batches.map(batch => batch.id));
        const certificates = QualityCertificateAssembler.toEntitiesFromResponse(certificatesResponse)
            .filter(certificate => batchIds.has(certificate.harvestBatchId))
            .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
        return { batches, certificates };
    }

    async function supervisePlot(organization, memberId, plotId, advisorUserId) {
        const { member, checkSession } = await readMember(organization, memberId);
        const denied = () => new Error('profiles.advisory.errors.denied');
        if (!member.userId || !member.plots.some(plot => plot.id === plotId)) throw denied();
        const previous = await assignmentsApi.getByPlot(plotId);
        if (previous && previous.producerUserId !== member.userId) throw denied();
        const releasing = advisorUserId == null;
        if (releasing && previous?.status !== 'ACTIVE') return;
        if (!releasing) {
            const team = await profilesApi.getTechnicalAdvisors(organization.id);
            if (!team.some(advisor => advisor.userId === advisorUserId)) throw denied();
        }
        checkSession();
        const now = new Date().toISOString();
        const closing = previous?.status === 'ACTIVE' && (releasing || previous.advisorUserId !== advisorUserId);
        const history = [...(previous?.history ?? [])];
        if (closing) history.push({ advisorUserId: previous.advisorUserId, assignedAt: previous.assignedAt, endedAt: now });
        return assignmentsApi.save({
            id: previous?.id ?? plotId, plotId, producerUserId: member.userId,
            advisorUserId: releasing ? previous.advisorUserId : advisorUserId,
            status: releasing ? 'INACTIVE' : 'ACTIVE',
            assignedAt: releasing || (previous?.status === 'ACTIVE' && !closing) ? previous.assignedAt : now,
            history
        }, previous != null);
    }

    async function loadPlotSupervision(organization, plots) {
        const [team, assignments] = await Promise.all([
            profilesApi.getTechnicalAdvisors(organization.id),
            Promise.all(plots.map(plot => assignmentsApi.getByPlot(plot.id)))
        ]);
        return { team: team.filter(advisor => Number.isSafeInteger(advisor.userId) && advisor.userId > 0), assignments };
    }

    return {
        linkMemberAccount,
        linkablePlots,
        linkMemberPlot,
        loadMemberHarvest,
        supervisePlot,
        loadPlotSupervision,
        registerCooperative,
        loadMemberDirectory,
        saveMember,
        profile,
        cooperative,
        members,
        technicalAdvisors,
        dashboard,
        loading,
        saving,
        error,
        contactSaved,
        activeMemberCount,
        clearContactFeedback,
        loadFarmerProfile,
        saveContact,
        saveAccount,
        loadCooperativeDashboard,
        loadInstitutionalDashboard,
        loadTechnicalAdvisors,
        saveCooperative,
        inviteTechnicalAdvisor,
        reassignTechnicalAdvisor,
        removeTechnicalAdvisor
    };
});

export default useProfilesStore;
