/**
 * Resolves and changes the farmer's demo advisor per owned plot (Angular `FarmerAdvisoryStore`).
 * This does not activate a plan. IAM and the backend must eventually validate
 * consent and ownership. Writes preserve previous assignments in the same resource.
 *
 * @module useFarmerAdvisoryStore
 */
import {defineStore} from "pinia";
import {computed, ref, watch} from "vue";
import useIamStore from "../../iam/application/iam.store.js";
import useFieldManagementStore from "../../field-management/application/field-management.store.js";
import {ProfilesApi} from "../infrastructure/profiles-api.js";
import {PlotAdvisorAssignmentsApi} from "../infrastructure/plot-advisor-assignments.api.js";

const profiles = new ProfilesApi();
const api = new PlotAdvisorAssignmentsApi();

/**
 * Reactive store that exposes the advisor of each plot of the farmer.
 *
 * @returns {Object} Store state and actions.
 */
const useFarmerAdvisoryStore = defineStore('farmer-advisory', () => {
    const session = useIamStore();
    const fields = useFieldManagementStore();

    const participant = ref(null);
    const advisorState = ref([]);
    const assignmentState = ref([]);
    const loadingState = ref(false);
    const savingState = ref(false);
    const errorState = ref(null);
    const ready = ref(false);
    // Increasing it makes the answers of a previous participant be ignored.
    let revision = 0;

    const current = computed(() => participant.value === session.currentUser && session.currentUser?.experience === 'FARMER');
    const advisors = computed(() => current.value ? advisorState.value : []);
    const assignments = computed(() => current.value
        ? assignmentState.value.filter(item => owns(item.plotId) && item.producerUserId === session.currentUser?.id)
        : []);
    const loading = computed(() => current.value && (loadingState.value || fields.plotsLoading));
    const saving = computed(() => current.value && savingState.value);
    const error = computed(() => current.value ? errorState.value : null);

    /** Reloads catalogue and assignments, ignoring requests from the previous participant. */
    function reload() {
        const started = ++revision;
        const user = session.currentUser;
        participant.value = user;
        advisorState.value = [];
        assignmentState.value = [];
        errorState.value = null;
        loadingState.value = false;
        savingState.value = false;
        ready.value = false;
        if (user?.experience !== 'FARMER') return;
        loadingState.value = true;
        Promise.all([profiles.getAvailableAdvisors(), api.getByProducer(user.id)])
            .then(([loadedAdvisors, loadedAssignments]) => {
                if (!isCurrent(started)) return;
                advisorState.value = loadedAdvisors;
                assignmentState.value = loadedAssignments;
                loadingState.value = false;
                ready.value = true;
            })
            .catch(() => {
                if (!isCurrent(started)) return;
                loadingState.value = false;
                errorState.value = 'profiles.advisory.errors.load';
            });
    }

    /**
     * @param {number} plotId - Plot.
     * @returns {import('../domain/model/entities/plot-advisor-assignment.js').PlotAdvisorAssignment|null} The assignment belonging to the current producer and plot.
     */
    function assignmentFor(plotId) {
        return assignments.value.find(item => item.plotId === plotId) ?? null;
    }

    /**
     * @param {number} plotId - Plot.
     * @returns {import('../domain/model/entities/technical-advisor.entity.js').TechnicalAdvisor|null} The professional linked by account ID, never by a coincident record ID.
     */
    function advisorFor(plotId) {
        const assignment = assignmentFor(plotId);
        return advisors.value.find(item => item.userId === (assignment?.status === 'ACTIVE' ? assignment.advisorUserId : undefined)) ?? null;
    }

    /**
     * @param {number} plotId - Plot.
     * @returns {boolean} `true` when this loaded producer can assign the referenced plot.
     */
    function canAssign(plotId) {
        return current.value && ready.value && !loading.value && !saving.value && owns(plotId);
    }

    /**
     * Changes responsibility after the view explicitly confirms the selected professional.
     * @param {number} plotId - Plot owned by the active producer.
     * @param {number} advisorUserId - Account reference of a selectable professional.
     * @param {function(): void} onSaved - Called only after server confirmation in the same session.
     */
    function assign(plotId, advisorUserId, onSaved) {
        if (saving.value) return;
        if (!canAssign(plotId) || !advisors.value.some(item => item.userId === advisorUserId)) {
            errorState.value = 'profiles.advisory.errors.denied';
            return;
        }
        const user = session.currentUser;
        const started = revision;
        savingState.value = true;
        errorState.value = null;
        api.getByPlot(plotId)
            .then(previous => {
                if (!isCurrent(started) || !owns(plotId) || (previous && previous.producerUserId !== user.id))
                    throw new Error('profiles.advisory.errors.denied');
                const assignedAt = new Date().toISOString();
                const history = previous?.history ?? [];
                const record = {
                    id: previous?.id ?? plotId,
                    plotId,
                    producerUserId: user.id,
                    status: 'ACTIVE',
                    advisorUserId,
                    assignedAt: previous?.advisorUserId === advisorUserId ? previous.assignedAt : assignedAt,
                    history: previous && previous.advisorUserId !== advisorUserId
                        ? [...history, { advisorUserId: previous.advisorUserId, assignedAt: previous.assignedAt, endedAt: assignedAt }]
                        : history
                };
                return api.save(record, previous !== null);
            })
            .then(record => {
                if (!isCurrent(started)) return;
                assignmentState.value = [...assignmentState.value.filter(item => item.plotId !== plotId), record];
                savingState.value = false;
                onSaved();
            })
            .catch(cause => {
                if (!isCurrent(started)) return;
                savingState.value = false;
                errorState.value = cause instanceof Error && cause.message.startsWith('profiles.advisory.errors.')
                    ? cause.message
                    : 'profiles.advisory.errors.save';
            });
    }

    function owns(plotId) {
        return fields.plots.some(plot => plot.id === plotId && plot.ownerUserId === session.currentUser?.id);
    }

    function isCurrent(started) {
        return started === revision && current.value;
    }

    // Reload every time the signed-in user changes.
    watch(() => session.currentUser, () => reload(), { immediate: true });

    return { advisors, assignments, loading, saving, error, reload, assignmentFor, advisorFor, canAssign, assign };
});

export default useFarmerAdvisoryStore;
