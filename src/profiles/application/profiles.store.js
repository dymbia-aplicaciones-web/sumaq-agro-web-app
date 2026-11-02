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
    function loadCooperativeDashboard(directorUserId) {
        loading.value = true;
        error.value = null;
        profilesApi.getInstitutionalDashboard(directorUserId)
            .then(loaded => dashboard.value = loaded)
            .catch(cause => error.value = cause.message)
            .finally(() => loading.value = false);
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

    return {
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
