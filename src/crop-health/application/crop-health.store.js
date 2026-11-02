/**
 * Application service store for the Crop Health bounded context (Angular `CropHealthStore`).
 * The scope depends on the role: the farmer sees their plots (shared with Field
 * Management), the agronomist and the director the plots of their cooperative.
 * Every answer is ignored if the user changed meanwhile. Permission checks are
 * demo UX only; the RESTful API must enforce them.
 *
 * @module useCropHealthStore
 */
import {defineStore} from "pinia";
import {computed, ref, watch} from "vue";
import {CropHealthApi} from "../infrastructure/crop-health-api.js";
import {SatelliteObservationAssembler} from "../infrastructure/satellite-observation.assembler.js";
import {AgroclimaticAlertAssembler} from "../infrastructure/agroclimatic-alert.assembler.js";
import {PestReportAssembler} from "../infrastructure/pest-report.assembler.js";
import {FieldInspectionAssembler} from "../infrastructure/field-inspection.assembler.js";
import {TechnicalPrescriptionAssembler} from "../infrastructure/technical-prescription.assembler.js";
import {PestReport} from "../domain/model/pest-report.entity.js";
import {FieldInspection} from "../domain/model/field-inspection.entity.js";
import {TechnicalPrescription} from "../domain/model/technical-prescription.entity.js";
import {INVALID_DATA, requireDate, todayInLima} from "../domain/model/validation.js";
import {FieldManagementApi} from "../../field-management/infrastructure/field-management-api.js";
import {ProfilesApi} from "../../profiles/infrastructure/profiles-api.js";
import {TechnicalAdvisorAssembler} from "../../profiles/infrastructure/technical-advisor.assembler.js";
import {CooperativeAssembler} from "../../profiles/infrastructure/cooperative.assembler.js";
import {CooperativeMemberAssembler} from "../../profiles/infrastructure/cooperative-member.assembler.js";
import useFieldManagementStore from "../../field-management/application/field-management.store.js";
import useIamStore from "../../iam/application/iam.store.js";

const cropHealthApi = new CropHealthApi();
const fieldManagementApi = new FieldManagementApi();
const profilesApi = new ProfilesApi();

const NOT_AUTHORIZED = 'crop-health.errors.not-authorized';

/** Keeps the domain i18n keys (`crop-health.errors.*`); anything else uses the fallback. */
const messageOf = (cause, fallback) => cause instanceof Error && cause.message.startsWith('crop-health.errors.') ? cause.message : fallback;

/** @throws {Error} Always: the action is not allowed. */
const denied = () => { throw new Error(NOT_AUTHORIZED); };

/**
 * Reactive store that exposes Crop Health commands and queries.
 *
 * @returns {Object} Store state and actions.
 */
const useCropHealthStore = defineStore('crop-health', () => {
    const iamStore = useIamStore();
    const fieldStore = useFieldManagementStore();

    const busy = ref({});
    const errors = ref({});
    const scopePlots = ref([]);
    const advisorsState = ref([]);
    const advisorState = ref(null);
    const scopeUser = ref(null);
    const ready = ref(false);
    const observationsState = ref([]);
    const reportsState = ref([]);
    const alertsState = ref([]);
    const inspectionsState = ref([]);
    const prescriptionsState = ref([]);
    let epoch = 0;

    const activeUser = computed(() => iamStore.currentUser);
    const canReport = computed(() => activeUser.value?.experience === 'FARMER');
    const canSchedule = computed(() => ['AGRONOMIST', 'COOPERATIVE_DIRECTOR'].includes(activeUser.value?.experience ?? ''));
    const scopeReady = computed(() => ready.value && scopeUser.value === activeUser.value?.id && (!canReport.value || !fieldStore.plotsLoading));
    /** Plots visible for the role. */
    const plots = computed(() => {
        if (!scopeReady.value) return [];
        return canReport.value ? fieldStore.plots.filter(plot => plot.ownerUserId === activeUser.value?.id) : scopePlots.value;
    });
    const selectedPlot = computed(() => plots.value.find(plot => plot.id === fieldStore.selectedPlotId));
    const observations = computed(() => scopeReady.value ? observationsState.value.filter(item => item.plotId === selectedPlot.value?.id) : []);
    const latestObservation = computed(() => observations.value[0] ?? null);
    const pestReports = computed(() => scopeReady.value ? reportsState.value.filter(report => plots.value.some(plot => plot.id === report.plotId)) : []);
    const alerts = computed(() => scopeReady.value ? alertsState.value.filter(item => item.region === selectedPlot.value?.region) : []);
    const inspections = computed(() => scopeReady.value ? inspectionsState.value.filter(item => pestReports.value.some(report => report.id === item.reportId)) : []);
    const prescriptions = computed(() => scopeReady.value ? prescriptionsState.value.filter(item => pestReports.value.some(report => report.id === item.reportId)) : []);
    const advisors = computed(() => scopeReady.value ? advisorsState.value : []);
    const currentAdvisor = computed(() => scopeReady.value ? advisorState.value : null);
    const canPrescribe = computed(() => activeUser.value?.experience === 'AGRONOMIST' && currentAdvisor.value?.userId === activeUser.value.id);
    const saving = computed(() => !!busy.value.write);
    const scopeLoading = computed(() => !!busy.value.scope || (canReport.value && fieldStore.plotsLoading));
    const clinicalLoading = computed(() => !!busy.value.clinical || scopeLoading.value);
    const observationsLoading = computed(() => !!busy.value.observations || scopeLoading.value);
    const alertsLoading = computed(() => !!busy.value.alerts || scopeLoading.value);
    const scopeError = computed(() => errors.value.scope
        ?? (canReport.value && fieldStore.error === 'field-management.errors.load-plots' ? 'crop-health.errors.load-plots' : null));
    const clinicalError = computed(() => scopeError.value ?? errors.value.clinical ?? null);
    const observationsError = computed(() => scopeError.value ?? errors.value.observations ?? null);
    const alertsError = computed(() => scopeError.value ?? errors.value.alerts ?? null);
    const writeError = computed(() => errors.value.write ?? null);
    const pendingPestReportsCount = computed(() => pestReports.value.filter(report => report.status === 'PENDING').length);
    const unreadAlertsCount = computed(() => alerts.value.filter(alert => !alert.read).length);
    const treatableReports = computed(() => pestReports.value.filter(report => report.status === 'INSPECTED'));
    const schedulableReports = computed(() => pestReports.value.filter(report =>
        report.status === 'PENDING' && !inspections.value.some(inspection => inspection.reportId === report.id)));

    const setBusy = (key, value) => busy.value = { ...busy.value, [key]: value };
    const setError = (key, value) => errors.value = { ...errors.value, [key]: value };

    /**
     * Runs a read; its answer is dropped if the user changed meanwhile.
     * @param {string} key - Request key.
     * @param {function(): Promise<*>} source - Request.
     * @param {function(*): void} onData - Applies the answer.
     * @param {string} fallback - i18n key of the error.
     * @returns {Promise<void>}
     */
    function read(key, source, onData, fallback) {
        const started = epoch;
        setBusy(key, true);
        setError(key, null);
        return source()
            .then(data => { if (started === epoch) onData(data); })
            .catch(cause => { if (started === epoch) setError(key, messageOf(cause, fallback)); })
            .finally(() => { if (started === epoch) setBusy(key, false); });
    }

    /**
     * Runs a write.
     * @param {function(): Promise<*>} operation - Checks and request.
     * @param {function(*): void} update - Applies the saved data.
     * @param {string|function(): string} fallback - i18n key of the error.
     * @returns {Promise<boolean>} `true` when saved.
     */
    function mutate(operation, update, fallback) {
        if (saving.value) return Promise.resolve(false);
        setError('write', null);
        const started = epoch;
        setBusy('write', true);
        return Promise.resolve()
            .then(() => { if (!scopeReady.value) denied(); return operation(); })
            .then(data => {
                if (started !== epoch) return false;
                update(data);
                return true;
            })
            .catch(cause => {
                if (started === epoch) setError('write', messageOf(cause, typeof fallback === 'string' ? fallback : fallback()));
                return false;
            })
            .finally(() => { if (started === epoch) setBusy('write', false); });
    }

    function reset() {
        epoch++;
        busy.value = {};
        errors.value = {};
        ready.value = false;
        scopeUser.value = null;
        scopePlots.value = [];
        advisorsState.value = [];
        advisorState.value = null;
        observationsState.value = [];
        reportsState.value = [];
        alertsState.value = [];
        inspectionsState.value = [];
        prescriptionsState.value = [];
    }

    /**
     * Plots, advisors and advisor record of a cooperative (its active members' plots).
     * @param {number} cooperativeId - Cooperative.
     * @param {Object|null} advisor - Advisor record of the agronomist.
     * @returns {Promise<{plots: Array, advisors: Array, advisor: Object|null}>} Scope.
     */
    function cooperativeScope(cooperativeId, advisor) {
        return Promise.all([profilesApi.getMembersByCooperative(cooperativeId), profilesApi.getAdvisorsByCooperative(cooperativeId)])
            .then(([membersResponse, advisorsResponse]) => {
                const ids = [...new Set(CooperativeMemberAssembler.toEntitiesFromResponse(membersResponse)
                    .filter(member => member.active).flatMap(member => member.plots.map(plot => plot.id)))];
                const scopeAdvisors = TechnicalAdvisorAssembler.toEntitiesFromResponse(advisorsResponse);
                if (!ids.length) return { plots: [], advisors: scopeAdvisors, advisor };
                return fieldManagementApi.getPlotsByIds(ids).then(scopePlots => ({
                    plots: scopePlots,
                    advisors: scopeAdvisors,
                    advisor
                }));
            });
    }

    /**
     * Resolves the plots visible for the user.
     * @param {import('../../iam/domain/model/user.entity.js').User|null} user - Active user.
     */
    function loadScope(user) {
        reset();
        if (!user) return;
        scopeUser.value = user.id;
        const source = () => {
            if (user.experience === 'FARMER') return Promise.resolve({ plots: [], advisors: [], advisor: null });
            if (user.experience === 'AGRONOMIST') {
                return profilesApi.getAdvisorsByUser(user.id).then(response => {
                    const advisor = TechnicalAdvisorAssembler.toEntitiesFromResponse(response)[0];
                    if (!advisor) throw new Error('crop-health.errors.advisor-not-assigned');
                    return cooperativeScope(advisor.cooperativeId, advisor);
                });
            }
            return profilesApi.getCooperativesByDirector(user.id).then(response => {
                const cooperative = CooperativeAssembler.toEntitiesFromResponse(response)[0];
                if (!cooperative) throw new Error('crop-health.errors.no-cooperative');
                return cooperativeScope(cooperative.id, null);
            });
        };
        read('scope', source, scope => {
            scopePlots.value = scope.plots;
            advisorsState.value = scope.advisors;
            advisorState.value = scope.advisor;
            ready.value = true;
            if (user.experience === 'FARMER') return; // Field Management keeps the farmer's selection.
            const selected = scope.plots.find(plot => plot.id === fieldStore.selectedPlotId) ?? scope.plots[0];
            fieldStore.selectPlotId(selected ? selected.id : null);
        }, 'crop-health.errors.load-plots');
    }

    /** @param {number} plotId - Plot to show. */
    function selectPlot(plotId) {
        if (!plots.value.some(plot => plot.id === plotId)) return;
        observationsState.value = [];
        alertsState.value = [];
        setError('observations', null);
        setError('alerts', null);
        fieldStore.selectPlotId(plotId);
        if (canReport.value) fieldStore.selectPlot(plotId);
    }

    /** @param {number} plotId - Plot whose satellite observations are loaded (newest first). */
    function loadObservations(plotId) {
        observationsState.value = [];
        const plot = plots.value.find(item => item.id === plotId);
        if (!plot?.hasPolygon()) return;
        read('observations', () => cropHealthApi.getObservationsByPlot(plotId), response => {
            const data = SatelliteObservationAssembler.toEntitiesFromResponse(response);
            if (data.some(item => item.plotId !== plotId || item.stressAreaHectares > plot.areaHectares)) throw new Error(INVALID_DATA);
            observationsState.value = [...data].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
        }, 'crop-health.errors.load-observations');
    }

    /** @param {string} region - Region whose agroclimatic alerts are loaded. */
    function loadAlerts(region) {
        alertsState.value = [];
        if (!plots.value.some(plot => plot.region === region)) return;
        read('alerts', () => cropHealthApi.getAlertsByRegion(region),
            response => alertsState.value = AgroclimaticAlertAssembler.toEntitiesFromResponse(response).filter(alert => alert.region === region),
            'crop-health.errors.load-alerts');
    }

    const alertById = id => alertsState.value.find(item => item.id === Number(id));
    const replaceAlert = updated => alertsState.value = alertsState.value.map(item => item.id === updated.id ? updated : item);

    function saveAlertChange(id, change, fallback) {
        return mutate(() => {
            const current = alertById(id);
            if (!current || !plots.value.some(plot => plot.region === current.region)) denied();
            const updated = current.clone();
            change(updated);
            return cropHealthApi.updateAlert(AgroclimaticAlertAssembler.toResourceFromEntity(updated));
        }, response => replaceAlert(AgroclimaticAlertAssembler.toEntityFromResource(response.data)), fallback);
    }

    /** Marks an alert as acknowledged without closing its action plan. */
    const markAlertRead = id => saveAlertChange(id, alert => alert.markRead(), 'crop-health.errors.save-alert');

    /** Confirms one task of the action plan. */
    const completeAlertTask = (id, taskId) => saveAlertChange(id, alert => alert.completeTask(taskId), 'crop-health.errors.save-alert-task');

    /** Closes an alert only when every required task is complete. */
    const finalizeAlert = id => saveAlertChange(id, alert => alert.finalize(), 'crop-health.errors.finalize-alert');

    /**
     * Loads pest reports, inspections and prescriptions of the plots in scope.
     * @returns {Promise<void>}
     */
    function loadClinicalData() {
        if (!scopeReady.value) return Promise.resolve();
        const scope = plots.value;
        return read('clinical', () => Promise.all(scope.map(plot => cropHealthApi.getPestReportsByPlot(plot.id)))
            .then(responses => {
                const reports = responses.flatMap(response => PestReportAssembler.toEntitiesFromResponse(response))
                    .filter(report => scope.some(plot => plot.id === report.plotId));
                const ids = new Set(reports.map(report => report.id));
                if (!ids.size) return { reports, inspections: [], prescriptions: [] };
                return Promise.all([cropHealthApi.getInspections(), cropHealthApi.getPrescriptions()])
                    .then(([inspectionsResponse, prescriptionsResponse]) => ({
                        reports,
                        inspections: FieldInspectionAssembler.toEntitiesFromResponse(inspectionsResponse).filter(item => ids.has(item.reportId)),
                        prescriptions: TechnicalPrescriptionAssembler.toEntitiesFromResponse(prescriptionsResponse).filter(item => ids.has(item.reportId))
                    }));
            }), data => {
            reportsState.value = data.reports;
            inspectionsState.value = data.inspections;
            prescriptionsState.value = data.prescriptions;
        }, 'crop-health.errors.load-workflow');
    }

    const report = id => pestReports.value.find(item => item.id === id) ?? denied();
    const replaceReport = updated => reportsState.value = reportsState.value.map(item => item.id === updated.id ? updated : item);

    /**
     * The farmer reports a pest on one of their plots.
     * @param {{plotId: number, description: string, severity: string}} command - Report data.
     * @returns {Promise<boolean>} `true` when saved.
     */
    function recordReport(command) {
        return mutate(() => {
            const user = activeUser.value;
            const plot = plots.value.find(item => item.id === command.plotId);
            if (!canReport.value || !user || !plot || plot.ownerUserId !== user.id) denied();
            const newReport = new PestReport({
                plotId: plot.id, plotName: plot.name, reporterId: user.id, description: command.description.trim(),
                severity: command.severity, photo: ''
            });
            return cropHealthApi.createPestReport(PestReportAssembler.toResourceFromEntity(newReport));
        }, response => reportsState.value = [...reportsState.value, PestReportAssembler.toEntityFromResource(response.data)], 'crop-health.errors.save-report');
    }

    /**
     * The agronomist or the director schedules the field visit of a pending report.
     * @param {number} reportId - Report.
     * @param {string} scheduledAt - Future date-time (ISO 8601).
     * @param {string} notes - Notes.
     * @returns {Promise<boolean>} `true` when saved.
     */
    function scheduleInspection(reportId, scheduledAt, notes) {
        return mutate(() => {
            if (!canSchedule.value) denied();
            if (report(reportId).status !== 'PENDING') throw new Error('crop-health.errors.invalid-transition');
            requireDate(scheduledAt);
            if (Date.parse(scheduledAt) <= Date.now()) throw new Error('crop-health.errors.future-visit');
            if (inspections.value.some(item => item.reportId === reportId)) throw new Error('crop-health.errors.visit-already-scheduled');
            const inspection = new FieldInspection({ reportId, scheduledAt, notes });
            return cropHealthApi.createInspection(FieldInspectionAssembler.toResourceFromEntity(inspection));
        }, response => inspectionsState.value = [...inspectionsState.value, FieldInspectionAssembler.toEntityFromResource(response.data)], 'crop-health.errors.save-inspection');
    }

    /**
     * The agronomist completes the visit and the report becomes inspected.
     * @param {number} id - Inspection.
     * @param {string} notes - Findings (at least 10 characters).
     * @returns {Promise<boolean>} `true` when saved.
     */
    function completeInspection(id, notes) {
        let inspectionSaved = false;
        return mutate(() => {
            const user = activeUser.value;
            const current = inspections.value.find(item => item.id === id);
            if (!canPrescribe.value || !user || !current) denied();
            const updatedReport = report(current.reportId).clone();
            if (updatedReport.status !== 'PENDING') throw new Error('crop-health.errors.invalid-transition');
            const inspection = current.clone();
            let saved;
            if (inspection.status === 'COMPLETED') {
                if (inspection.inspectorUserId !== user.id) denied();
                saved = Promise.resolve(inspection);
            } else {
                inspection.complete(notes, user.id);
                saved = cropHealthApi.updateInspection(FieldInspectionAssembler.toResourceFromEntity(inspection))
                    .then(response => FieldInspectionAssembler.toEntityFromResource(response.data));
            }
            return saved.then(result => {
                inspectionSaved = true;
                inspectionsState.value = inspectionsState.value.map(item => item.id === result.id ? result : item);
                updatedReport.markInspected();
                return cropHealthApi.updatePestReport(PestReportAssembler.toResourceFromEntity(updatedReport));
            });
        }, response => replaceReport(PestReportAssembler.toEntityFromResource(response.data)),
            () => inspectionSaved ? 'crop-health.errors.inspection-status-partial' : 'crop-health.errors.complete-inspection');
    }

    /**
     * The agronomist issues the prescription of an inspected report.
     * @param {{reportId: number, recommendedProducts: string, dosageInstructions: string, applicationDate: string}} command - Prescription data.
     * @returns {Promise<boolean>} `true` when saved.
     */
    function issuePrescription(command) {
        return mutate(() => {
            const user = activeUser.value;
            if (!canPrescribe.value || !user) denied();
            if (report(command.reportId).status !== 'INSPECTED') throw new Error('crop-health.errors.inspection-required');
            requireDate(command.applicationDate);
            if (command.applicationDate < todayInLima()) throw new Error('crop-health.errors.past-application');
            const prescription = new TechnicalPrescription({ ...command, agronomistId: user.id });
            return cropHealthApi.createPrescription(TechnicalPrescriptionAssembler.toResourceFromEntity(prescription));
        }, response => prescriptionsState.value = [...prescriptionsState.value, TechnicalPrescriptionAssembler.toEntityFromResource(response.data)], 'crop-health.errors.save-prescription');
    }

    /**
     * The agronomist closes a report that already has a prescription.
     * @param {number} id - Report.
     * @returns {Promise<boolean>} `true` when saved.
     */
    function resolveReport(id) {
        return mutate(() => {
            if (!canPrescribe.value) denied();
            const updated = report(id).clone();
            if (!prescriptions.value.some(item => item.reportId === id)) throw new Error('crop-health.errors.prescription-required');
            updated.resolve();
            return cropHealthApi.updatePestReport(PestReportAssembler.toResourceFromEntity(updated));
        }, response => replaceReport(PestReportAssembler.toEntityFromResource(response.data)), 'crop-health.errors.resolve-report');
    }

    /**
     * @param {number} id - Report.
     * @returns {boolean} `true` when the farmer can still delete their pending report.
     */
    function canDeleteReport(id) {
        const item = pestReports.value.find(candidate => candidate.id === id);
        return canReport.value && !clinicalLoading.value && !clinicalError.value && !!item &&
            item.reporterId === activeUser.value?.id && item.status === 'PENDING' &&
            !inspections.value.some(inspection => inspection.reportId === id) &&
            !prescriptions.value.some(prescription => prescription.reportId === id);
    }

    /**
     * @param {number} id - Report to delete.
     * @returns {Promise<boolean>} `true` when deleted.
     */
    function deleteReport(id) {
        return mutate(() => {
            if (!canDeleteReport(id)) denied();
            return cropHealthApi.deletePestReport(id);
        }, () => reportsState.value = reportsState.value.filter(item => item.id !== id), 'crop-health.errors.delete-report');
    }

    /** Clears the error of the last write. */
    const clearError = () => setError('write', null);

    /**
     * @param {number} id - Report.
     * @returns {string} `#1 · Plot name`: number of the report inside the user's scope.
     */
    function reportLabel(id) {
        const sorted = [...pestReports.value].sort((a, b) => a.id - b.id);
        const index = sorted.findIndex(item => item.id === id);
        return index >= 0 ? `#${index + 1} · ${sorted[index].plotName}` : `#${id}`;
    }

    /**
     * @param {number} userId - Agronomist user.
     * @returns {string} Name of the agronomist.
     */
    function advisorName(userId) {
        return advisors.value.find(item => item.userId === userId)?.name
            ?? iamStore.users.find(user => user.id === userId)?.displayName ?? `#${userId}`;
    }

    /** @param {number} id - Report. @returns {boolean} `true` when the agronomist can resolve it. */
    const canResolve = id => canPrescribe.value && pestReports.value.some(item => item.id === id && item.status === 'INSPECTED')
        && prescriptions.value.some(item => item.reportId === id);

    /** @param {FieldInspection} inspection - Inspection. @returns {boolean} `true` when the agronomist can complete it. */
    const canComplete = inspection => canPrescribe.value
        && pestReports.value.some(item => item.id === inspection.reportId && item.status === 'PENDING')
        && (inspection.status === 'SCHEDULED' || inspection.inspectorUserId === activeUser.value?.id);

    // Resolve the scope again every time the user changes.
    watch(activeUser, user => loadScope(user), { immediate: true });
    // Alerts also feed the global notification badge, so they follow the selected plot globally.
    watch(selectedPlot, plot => plot ? loadAlerts(plot.region) : alertsState.value = [], { immediate: true });

    return {
        activeUser, scopeReady, plots, selectedPlot, observations, latestObservation, pestReports, alerts, inspections,
        prescriptions, advisors, currentAdvisor, canReport, canSchedule, canPrescribe, saving, scopeLoading,
        clinicalLoading, observationsLoading, alertsLoading, scopeError, clinicalError, observationsError, alertsError,
        writeError, pendingPestReportsCount, unreadAlertsCount, treatableReports, schedulableReports,
        selectPlot, loadObservations, loadAlerts, alertById, markAlertRead, completeAlertTask, finalizeAlert,
        loadClinicalData, recordReport, scheduleInspection, completeInspection,
        issuePrescription, resolveReport, canDeleteReport, deleteReport, clearError, reportLabel, advisorName,
        canResolve, canComplete
    };
});

export default useCropHealthStore;
