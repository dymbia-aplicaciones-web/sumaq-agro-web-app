import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {FarmerProfileAssembler} from "./assemblers/farmer-profile.assembler.js";
import {CooperativeAssembler} from "./assemblers/cooperative.assembler.js";
import {TechnicalAdvisorAssembler} from "./assemblers/technical-advisor.assembler.js";
import {FarmerProfilesApiEndpoint} from "./endpoints/farmer-profiles.endpoint.js";
import {CooperativesApiEndpoint} from "./endpoints/cooperatives.endpoint.js";
import {CooperativeMembersApiEndpoint} from "./endpoints/cooperative-members.endpoint.js";
import {CooperativeDashboardApiEndpoint} from "./endpoints/cooperative-dashboard.endpoint.js";
import {TechnicalAdvisorsApiEndpoint} from "./endpoints/technical-advisors.endpoint.js";

/**
 * Facade that exposes only the Profile data required by its application layer.
 * Every operation returns domain entities.
 *
 * @class ProfilesApi
 * @extends BaseApi
 */
export class ProfilesApi extends BaseApi {
    #farmerProfilesEndpoint;
    #cooperativesEndpoint;
    #cooperativeMembersEndpoint;
    #cooperativeDashboardEndpoint;
    #technicalAdvisorsEndpoint;

    /** Creates endpoint clients for profiles, cooperatives, members, dashboards and advisors. */
    constructor() {
        super();
        this.#farmerProfilesEndpoint = new FarmerProfilesApiEndpoint(this);
        this.#cooperativesEndpoint = new CooperativesApiEndpoint(this);
        this.#cooperativeMembersEndpoint = new CooperativeMembersApiEndpoint(this);
        this.#cooperativeDashboardEndpoint = new CooperativeDashboardApiEndpoint(this);
        this.#technicalAdvisorsEndpoint = new TechnicalAdvisorsApiEndpoint(this);
    }

    /** @param {number} userId - Farmer. @returns {Promise<import('../domain/model/entities/farmer-profile.entity.js').FarmerProfile>} Profile. */
    getFarmerProfile(userId) {
        return this.#farmerProfilesEndpoint.getByUser(userId);
    }

    /** @param {import('../domain/model/entities/farmer-profile.entity.js').FarmerProfile} profile - Profile to save. @returns {Promise<import('../domain/model/entities/farmer-profile.entity.js').FarmerProfile>} Saved profile. */
    updateFarmerProfile(profile) {
        return this.#farmerProfilesEndpoint.update(profile.id, FarmerProfileAssembler.toResourceFromEntity(profile))
            .then(response => FarmerProfileAssembler.toEntityFromResource(response.data));
    }

    /** @param {number} userId - Director. @returns {Promise<import('../domain/model/entities/cooperative.entity.js').Cooperative|null>} Cooperative, or `null`. */
    getCooperativeByDirector(userId) {
        return this.#cooperativesEndpoint.getByDirector(userId);
    }

    /** @param {import('../domain/model/entities/cooperative.entity.js').Cooperative} cooperative - Cooperative to save. @returns {Promise<import('../domain/model/entities/cooperative.entity.js').Cooperative>} Saved cooperative. */
    updateCooperative(cooperative) {
        return this.#cooperativesEndpoint.update(cooperative.id, CooperativeAssembler.toResourceFromEntity(cooperative))
            .then(response => CooperativeAssembler.toEntityFromResource(response.data));
    }

    /** @param {number} cooperativeId - Cooperative. @returns {Promise<import('../domain/model/entities/cooperative-member.entity.js').CooperativeMember[]>} Members. */
    getCooperativeMembers(cooperativeId) {
        return this.#cooperativeMembersEndpoint.getByCooperative(cooperativeId);
    }

    /**
     * Finds the cooperative memberships of an account independently of member IDs.
     * @param {number} userId - Current account identifier; IAM will supply it in production.
     * @returns {Promise<import('../domain/model/entities/cooperative-member.entity.js').CooperativeMember[]>} Membership read models owned by Profiles.
     */
    getMembershipsByUser(userId) {
        return this.#cooperativeMembersEndpoint.getByUser(userId);
    }

    /** @param {number} directorUserId - Director. @returns {Promise<import('../domain/model/entities/cooperative-dashboard.entity.js').CooperativeDashboard|null>} Dashboard, or `null`. */
    getInstitutionalDashboard(directorUserId) {
        return this.#cooperativeDashboardEndpoint.getByDirector(directorUserId);
    }

    /** @param {number} userId - Agronomist account. @returns {Promise<import('../domain/model/entities/technical-advisor.entity.js').TechnicalAdvisor|null>} Advisor record, or `null`. */
    getAdvisorByUser(userId) {
        return this.#technicalAdvisorsEndpoint.getByUser(userId);
    }

    /** @param {number} cooperativeId - Cooperative. @returns {Promise<import('../domain/model/entities/technical-advisor.entity.js').TechnicalAdvisor[]>} Advisors. */
    getTechnicalAdvisors(cooperativeId) {
        return this.#technicalAdvisorsEndpoint.getByCooperative(cooperativeId);
    }

    /**
     * Lists demo professionals with a linked account, without requiring cooperative membership.
     * @returns {Promise<import('../domain/model/entities/technical-advisor.entity.js').TechnicalAdvisor[]>} One advisor per account.
     */
    getAvailableAdvisors() {
        return this.#technicalAdvisorsEndpoint.getAll().then(response => [
            ...new Map(TechnicalAdvisorAssembler.toEntitiesFromResponse(response)
                .filter(item => Number.isSafeInteger(item.userId) && item.userId > 0)
                .map(item => [item.userId, item])).values()
        ]);
    }

    /** @param {import('../domain/model/entities/technical-advisor.entity.js').TechnicalAdvisor} advisor - Advisor to create. @returns {Promise<import('../domain/model/entities/technical-advisor.entity.js').TechnicalAdvisor>} Created advisor. */
    createTechnicalAdvisor(advisor) {
        return this.#technicalAdvisorsEndpoint.create(TechnicalAdvisorAssembler.toResourceFromEntity(advisor))
            .then(response => TechnicalAdvisorAssembler.toEntityFromResource(response.data));
    }

    /** @param {import('../domain/model/entities/technical-advisor.entity.js').TechnicalAdvisor} advisor - Advisor to save. @returns {Promise<import('../domain/model/entities/technical-advisor.entity.js').TechnicalAdvisor>} Saved advisor. */
    updateTechnicalAdvisor(advisor) {
        return this.#technicalAdvisorsEndpoint.update(advisor.id, TechnicalAdvisorAssembler.toResourceFromEntity(advisor))
            .then(response => TechnicalAdvisorAssembler.toEntityFromResource(response.data));
    }

    /** @param {number} id - Advisor record. @returns {Promise<void>} */
    deleteTechnicalAdvisor(id) {
        return this.#technicalAdvisorsEndpoint.delete(id).then(() => undefined);
    }
}
