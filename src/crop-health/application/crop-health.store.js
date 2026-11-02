/**
 * Application service store for the Crop Health bounded context (Angular `CropHealthStore`).
 * It coordinates scoped data and participant permissions: the farmer sees their
 * plots (shared with Field Management), the agronomist the plots explicitly
 * assigned to them and the director the plots of their cooperative. Every
 * answer is ignored if the user changed meanwhile. Production authorization
 * belongs to the API.
 *
 * @module useCropHealthStore
 */
import {defineStore} from "pinia";
import {computed, ref, watch} from "vue";
import useIamStore from "../../iam/application/iam.store.js";
import useFieldManagementStore from "../../field-management/application/field-management.store.js";
import {FieldManagementApi} from "../../field-management/infrastructure/field-management-api.js";
import {ProfilesApi} from "../../profiles/infrastructure/profiles-api.js";
import {PlotAdvisorAssignmentsApi} from "../../profiles/infrastructure/plot-advisor-assignments.api.js";
import {CropHealthApi} from "../infrastructure/crop-health-api.js";
import {CaseAssessmentsApi} from "../infrastructure/case-assessments.api.js";
import {TreatmentFollowUpsApi} from "../infrastructure/treatment-follow-ups.api.js";
import {RecordPestReportCommand} from "../domain/model/commands/record-pest-report.command.js";
import {CaseAssessment} from "../domain/model/entities/case-assessment.js";
import {FieldInspection} from "../domain/model/entities/field-inspection.entity.js";
import {PestReport} from "../domain/model/entities/pest-report.entity.js";
import {TechnicalPrescription} from "../domain/model/entities/technical-prescription.entity.js";
import {TreatmentFollowUp} from "../domain/model/entities/treatment-follow-up.js";
import {requireDate, todayInLima} from "../domain/model/validation.js";

const api = new CropHealthApi();
const assignmentApi = new PlotAdvisorAssignmentsApi();
const assessmentApi = new CaseAssessmentsApi();
const followUpApi = new TreatmentFollowUpsApi();
const profiles = new ProfilesApi();
const fields = new FieldManagementApi();

/**
 * Runs a request again up to `retries` times when it fails (RxJS `retry(2)`).
 * @template T
 * @param {function(): Promise<T>} request - Request to run.
 * @param {number} [retries=2] - Extra attempts.
 * @returns {Promise<T>} Result of the first attempt that succeeds.
 */
const withRetry = (request, retries = 2) =>
    request().catch(error => retries > 0 ? withRetry(request, retries - 1) : Promise.reject(error));

/** @throws {Error} Always: the action is not allowed. */
const denied = () => { throw new Error('crop-health.errors.not-authorized'); };

/** Keeps the domain i18n keys (`crop-health.errors.*`); anything else uses the fallback. */
const message = (error, fallback) =>
    error instanceof Error && error.message.startsWith('crop-health.errors.') ? error.message : fallback;

/**
 * Reactive store that exposes Crop Health commands and queries.
 *
 * @returns {Object} Store state and actions.
 */
const useCropHealthStore = defineStore('crop-health', () => {
    const session = useIamStore();
    const fieldStore = useFieldManagementStore();

    const busy = ref({});
    const errors = ref({});
    const plotsState = ref([]);
    const advisorState = ref(null);
    const advisorsState = ref([]);
    const scopeUser = ref(null);
    const ready = ref(false);
    const observationsState = ref([]);
    const reportsState = ref([]);
    const alertsState = ref([]);
    const forecastsState = ref([]);
    const inspectionsState = ref([]);
    const prescriptionsState = ref([]);
    const followUpsState = ref([]);
    const assessmentsState = ref([]);
    // Increasing the epoch makes the answers of a previous user be ignored; the
    // request token of each key makes the answers of a replaced request be ignored.
    let epoch = 0;
    const requests = new Map();

    const activeUser = computed(() => session.currentUser);
    const canReport = computed(() => activeUser.value?.experience === 'FARMER');
    const canSchedule = computed(() => ['AGRONOMIST', 'COOPERATIVE_DIRECTOR'].includes(activeUser.value?.experience ?? ''));
    const scopeReady = computed(() =>
        ready.value && scopeUser.value === activeUser.value?.id && (!canReport.value || !fieldStore.plotsLoading));
    const plots = computed(() => !scopeReady.value
        ? []
        : canReport.value
            ? fieldStore.plots.filter(plot => plot.ownerUserId === activeUser.value?.id)
            : plotsState.value);
    const selectedPlot = computed(() => plots.value.find(plot => plot.id === fieldStore.selectedPlotId));
    const observations = computed(() => scopeReady.value
        ? observationsState.value.filter(item => item.plotId === selectedPlot.value?.id)
        : []);
    const latestObservation = computed(() => observations.value[0] ?? null);
    const pestReports = computed(() => scopeReady.value
        ? reportsState.value.filter(report => plots.value.some(plot => plot.id === report.plotId)
            && (!canReport.value || report.reporterId === activeUser.value?.id))
        : []);
    const alerts = computed(() => scopeReady.value
        ? alertsState.value.filter(item => item.region === selectedPlot.value?.region)
        : []);
    const forecasts = computed(() => scopeReady.value ? forecastsState.value : []);
    const inspections = computed(() => scopeReady.value
        ? inspectionsState.value.filter(inspection => pestReports.value.some(report => report.id === inspection.reportId))
        : []);
    const prescriptions = computed(() => scopeReady.value
        ? prescriptionsState.value.filter(prescription => pestReports.value.some(report => report.id === prescription.reportId))
        : []);
    /** Farmer evidence remains scoped to reports visible to the current participant. */
    const followUps = computed(() => scopeReady.value
        ? followUpsState.value.filter(item => pestReports.value.some(report =>
            report.id === item.data.reportId && report.reporterId === item.data.producerUserId))
        : []);
    /** Assessments are visible only through the participant's authorized case list. */
    const assessments = computed(() => scopeReady.value
        ? assessmentsState.value.filter(item => pestReports.value.some(report => report.id === item.data.reportId))
        : []);
    const advisors = computed(() => scopeReady.value ? advisorsState.value : []);
    const currentAdvisor = computed(() => scopeReady.value ? advisorState.value : null);
    const canPrescribe = computed(() =>
        activeUser.value?.experience === 'AGRONOMIST' && currentAdvisor.value?.userId === activeUser.value?.id);
    const saving = computed(() => !!busy.value.write);
    const loading = computed(() => Object.entries(busy.value).some(([key, value]) => key !== 'write' && value));
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
    const error = computed(() => Object.values(errors.value).find(value => value) ?? null);
    const pendingPestReportsCount = computed(() => pestReports.value.filter(report => report.status === 'PENDING').length);
    const treatableReports = computed(() => pestReports.value.filter(report => report.status === 'INSPECTED'));
    const schedulableReports = computed(() => pestReports.value.filter(report =>
        report.status === 'PENDING' && !inspections.value.some(inspection => inspection.reportId === report.id)));

    function loadScope(user) {
        reset();
        if (!user) return;
        scopeUser.value = user.id;
        const source = () => user.experience === 'FARMER'
            ? fields.getPlotsByOwner(user.id).then(scopePlots => ({ plots: scopePlots, advisors: [], advisor: null }))
            : user.experience === 'AGRONOMIST'
                ? profiles.getAdvisorByUser(user.id).then(advisor => {
                    if (!advisor) throw new Error('crop-health.errors.advisor-not-assigned');
                    return advisorScope(advisor, user.id);
                })
                : profiles.getCooperativeByDirector(user.id).then(cooperative => {
                    if (!cooperative) throw new Error('crop-health.errors.no-cooperative');
                    return cooperativeScope(cooperative.id, null);
                });
        read('scope', () => withRetry(source), data => {
            plotsState.value = data.plots;
            advisorsState.value = data.advisors;
            advisorState.value = data.advisor;
            ready.value = true;
            const selected = data.plots.find(plot => plot.id === fieldStore.selectedPlotId) ?? data.plots[0];
            fieldStore.selectPlotId(selected ? selected.id : null);
        }, 'crop-health.errors.load-plots');
    }

    /** Resolves explicit active plot grants without requiring a cooperative membership. */
    function advisorScope(advisor, userId) {
        return assignmentApi.getByAdvisor(userId).then(records => {
            const active = records.filter(item => item.advisorUserId === userId && item.status === 'ACTIVE');
            if (new Set(active.map(item => item.plotId)).size !== active.length)
                throw new Error('crop-health.errors.assignment-conflict');
            return (active.length ? fields.getPlotsByIds(active.map(item => item.plotId)) : Promise.resolve([]))
                .then(found => ({
                    plots: found.filter(plot => active.some(item => item.plotId === plot.id && item.producerUserId === plot.ownerUserId)),
                    advisors: [advisor],
                    advisor
                }));
        });
    }

    /** Rechecks the current grant before each professional write, including partial-write retries. */
    function withResponsibility(reportId, operation) {
        const user = activeUser.value;
        const current = report(reportId);
        if (user?.experience !== 'AGRONOMIST') return Promise.resolve().then(operation);
        return assignmentApi.getByPlot(current.plotId).then(assignment => {
            const plot = plots.value.find(item => item.id === current.plotId);
            if (user !== activeUser.value || !scopeReady.value || !plot || assignment?.status !== 'ACTIVE'
                || assignment.advisorUserId !== user.id || assignment.producerUserId !== plot.ownerUserId
                || current.reporterId !== plot.ownerUserId) {
                plotsState.value = plotsState.value.filter(item => item.id !== current.plotId);
                denied();
            }
            return operation();
        });
    }

    /**
     * @param {number} userId - Producer account.
     * @returns {string} The current account's display name; other producers remain identifiable by account ID.
     */
    function producerName(userId) {
        const user = session.currentUser;
        return user?.id === userId ? user.displayName : `#${userId}`;
    }

    function cooperativeScope(cooperativeId, advisor) {
        return Promise.all([profiles.getCooperativeMembers(cooperativeId), profiles.getTechnicalAdvisors(cooperativeId)])
            .then(([members, scopeAdvisors]) => {
                const ids = [...new Set(members.filter(member => member.active).flatMap(member => member.plots.map(plot => plot.id)))];
                return (ids.length ? fields.getPlotsByIds(ids) : Promise.resolve([]))
                    .then(scopePlots => ({ plots: scopePlots, advisors: scopeAdvisors, advisor }));
            });
    }

    /** Retries failed scope resolution; views reload their data once the scope is ready. */
    function retryScope() {
        const user = activeUser.value;
        if (user?.experience === 'FARMER' && fieldStore.error) fieldStore.loadMyPlots(user.id);
        loadScope(user);
    }

    /** @param {number} plotId - Plot to show. */
    function selectPlot(plotId) {
        if (!plots.value.some(plot => plot.id === plotId)) return;
        requests.delete('observations');
        requests.delete('alerts');
        setBusy('observations', false);
        setBusy('alerts', false);
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
        if (!plots.value.some(plot => plot.id === plotId && plot.hasPolygon())) return;
        read('observations', () => withRetry(() => api.getObservationsByPlot(plotId)), data => {
            const plot = plots.value.find(item => item.id === plotId);
            if (!plot) return;
            if (data.some(observation => observation.plotId !== plotId || observation.stressAreaHectares > plot.areaHectares))
                throw new Error('crop-health.errors.invalid-data');
            observationsState.value = [...data].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
        }, 'crop-health.errors.load-observations');
    }

    /** @param {string} region - Region whose agroclimatic alerts are loaded. */
    function loadAlerts(region) {
        alertsState.value = [];
        if (!plots.value.some(plot => plot.region === region)) return;
        read('alerts', () => withRetry(() => api.getAlertsByRegion(region)),
            data => alertsState.value = data.filter(alert => alert.region === region), 'crop-health.errors.load-alerts');
    }

    /**
     * Loads pest reports, inspections, prescriptions, farmer evidence and assessments of the plots in scope.
     * @param {function(): void} [onLoaded] - Called once the data is shown.
     */
    function loadClinicalData(onLoaded) {
        if (!scopeReady.value) return;
        const scope = plots.value;
        const source = () => (scope.length
            ? Promise.all(scope.map(plot => api.getPestReportsByPlot(plot.id))).then(groups => groups.flat())
            : Promise.resolve([]))
            .then(reports => {
                const allowed = reports.filter(item =>
                    scope.some(plot => plot.id === item.plotId
                        && (activeUser.value?.experience !== 'AGRONOMIST' || plot.ownerUserId === item.reporterId))
                    && (!canReport.value || item.reporterId === activeUser.value?.id));
                const ids = new Set(allowed.map(item => item.id));
                if (!ids.size) return { reports: allowed, inspections: [], prescriptions: [], followUps: [], assessments: [] };
                return Promise.all([
                    Promise.all([...ids].map(id => assessmentApi.getByReport(id))),
                    api.getInspections(),
                    api.getPrescriptions(),
                    Promise.all([...ids].map(id => followUpApi.getByReport(id)))
                ]).then(([assessmentGroups, loadedInspections, loadedPrescriptions, followUpGroups]) => ({
                    reports: allowed,
                    assessments: assessmentGroups.flat().filter(item => ids.has(item.data.reportId)),
                    inspections: loadedInspections.filter(item => ids.has(item.reportId)),
                    prescriptions: loadedPrescriptions.filter(item => ids.has(item.reportId)),
                    followUps: followUpGroups.flat().filter(item => ids.has(item.data.reportId)
                        && allowed.some(candidate => candidate.id === item.data.reportId && candidate.reporterId === item.data.producerUserId))
                }));
            });
        read('clinical', () => withRetry(source), data => {
            reportsState.value = data.reports;
            inspectionsState.value = data.inspections;
            prescriptionsState.value = data.prescriptions;
            followUpsState.value = data.followUps;
            assessmentsState.value = data.assessments;
            onLoaded?.();
        }, 'crop-health.errors.load-workflow');
    }

    /**
     * The farmer reports a pest on one of their plots.
     * @param {RecordPestReportCommand} command - Report data.
     * @param {function(): void} onSaved - Called after the API confirms.
     * @param {function(): void} onFailure - Called when it fails.
     */
    function recordReport(command, onSaved, onFailure) {
        mutate(() => {
            const user = activeUser.value;
            const plot = plots.value.find(item => item.id === command.plotId);
            if (!canReport.value || !user || !plot || plot.ownerUserId !== user.id || command.reporterId !== user.id) denied();
            new PestReport({ ...command });
            return api.recordReport(new RecordPestReportCommand({ ...command, plotName: plot.name }));
        }, saved => reportsState.value = [...reportsState.value, saved], onSaved, onFailure, 'crop-health.errors.save-report');
    }

    /**
     * The agronomist or the director schedules the field visit of a pending report.
     * @param {import('../domain/model/commands/schedule-field-inspection.command.js').ScheduleFieldInspectionCommand} command - Visit data.
     * @param {function(): void} onSaved - Called after the API confirms.
     * @param {function(): void} onFailure - Called when it fails.
     */
    function scheduleInspection(command, onSaved, onFailure) {
        mutate(() => {
            if (!canSchedule.value) denied();
            if (report(command.reportId).status !== 'PENDING') throw new Error('crop-health.errors.invalid-transition');
            requireDate(command.scheduledAt);
            if (Date.parse(command.scheduledAt) <= Date.now()) throw new Error('crop-health.errors.future-visit');
            if (inspections.value.some(item => item.reportId === command.reportId))
                throw new Error('crop-health.errors.visit-already-scheduled');
            return withResponsibility(command.reportId, () => api.scheduleInspection(command));
        }, saved => inspectionsState.value = [...inspectionsState.value, saved], onSaved, onFailure, 'crop-health.errors.save-inspection');
    }

    /**
     * The agronomist completes the visit and the report becomes inspected.
     * @param {number} id - Inspection.
     * @param {string} notes - Findings (at least 10 characters).
     * @param {function(): void} onSaved - Called after the API confirms.
     * @param {function(): void} onFailure - Called when it fails.
     */
    function completeInspection(id, notes, onSaved, onFailure) {
        let inspectionSaved = false;
        mutate(() => {
            const user = activeUser.value;
            const current = inspections.value.find(item => item.id === id);
            if (!canPrescribe.value || !user || !current) denied();
            const updatedReport = copyReport(report(current.reportId));
            if (updatedReport.status !== 'PENDING') throw new Error('crop-health.errors.invalid-transition');
            const inspection = new FieldInspection({
                id: current.id,
                reportId: current.reportId,
                scheduledAt: current.scheduledAt,
                notes: current.notes,
                status: current.status,
                completedAt: current.completedAt,
                inspectorUserId: current.inspectorUserId
            });
            let saved;
            if (inspection.status === 'COMPLETED') {
                if (inspection.inspectorUserId !== user.id || updatedReport.status !== 'PENDING') denied();
                saved = () => Promise.resolve(inspection);
            } else {
                inspection.complete(notes, user.id);
                saved = () => api.updateInspection(inspection);
            }
            return withResponsibility(current.reportId, saved)
                .then(result => {
                    inspectionSaved = true;
                    inspectionsState.value = inspectionsState.value.map(item => item.id === result.id ? result : item);
                    if (updatedReport.status !== 'PENDING') return updatedReport;
                    updatedReport.markInspected();
                    return withResponsibility(updatedReport.id, () => api.updateReport(updatedReport));
                });
        }, replaceReport, onSaved, onFailure,
            () => inspectionSaved ? 'crop-health.errors.inspection-status-partial' : 'crop-health.errors.complete-inspection');
    }

    /**
     * The agronomist issues the prescription of an inspected report.
     * @param {import('../domain/model/commands/issue-technical-prescription.command.js').IssueTechnicalPrescriptionCommand} command - Prescription data.
     * @param {function(): void} onSaved - Called after the API confirms.
     * @param {function(): void} onFailure - Called when it fails.
     */
    function issuePrescription(command, onSaved, onFailure) {
        mutate(() => {
            if (!canPrescribe.value || command.agronomistId !== activeUser.value?.id) denied();
            if (report(command.reportId).status !== 'INSPECTED') throw new Error('crop-health.errors.inspection-required');
            requireDate(command.applicationDate);
            if (command.applicationDate < todayInLima()) throw new Error('crop-health.errors.past-application');
            new TechnicalPrescription({ ...command });
            return withResponsibility(command.reportId, () => api.issuePrescription(command));
        }, saved => prescriptionsState.value = [...prescriptionsState.value, saved], onSaved, onFailure, 'crop-health.errors.save-prescription');
    }

    /**
     * Records an agronomist's evaluation after rereading the case and farmer evidence.
     * Recovery requires application and evolution for every prescription. The
     * assessment is persisted first. A failed report update keeps that assessment
     * and reuses its ID when retrying; production must make these writes transactional.
     * @param {{id: string, reportId: number, outcome: string, notes: string}} command - Stable draft ID, conclusion and notes. Author/time derive from the session.
     * @param {function(): void} onSaved - Invoked after the evaluation and any required closure are confirmed.
     * @param {function(): void} onFailure - Retains the form draft for correction or retry.
     */
    function recordAssessment(command, onSaved, onFailure) {
        let assessmentSaved = false;
        mutate(() => {
            if (!canPrescribe.value || clinicalLoading.value || clinicalError.value) denied();
            const user = activeUser.value;
            const current = report(command.reportId);
            return withResponsibility(command.reportId, () => Promise.all([
                api.getPestReportsByPlot(current.plotId),
                api.getPrescriptionsByReportId(command.reportId),
                followUpApi.getByReport(command.reportId),
                assessmentApi.getByReport(command.reportId)
            ])).then(([loadedReports, loadedPrescriptions, loadedFollowUps, loadedAssessments]) => {
                const found = loadedReports.find(item => item.id === command.reportId
                    && item.reporterId === current.reporterId && item.plotId === current.plotId);
                if (!found) denied();
                const reportPrescriptions = loadedPrescriptions.filter(item => item.reportId === command.reportId);
                const evidence = loadedFollowUps.filter(item => item.data.reportId === command.reportId
                    && item.data.producerUserId === found.reporterId
                    && reportPrescriptions.some(rx => rx.id === item.data.prescriptionId)
                    && item.data.occurredOn <= todayInLima());
                const evolved = reportPrescriptions.filter(rx => evidence.some(item =>
                    item.data.prescriptionId === rx.id && item.data.kind === 'EVOLUTION'
                    && evidence.some(application => application.data.prescriptionId === rx.id
                        && application.data.kind === 'APPLICATION'
                        && application.data.occurredOn >= rx.applicationDate.slice(0, 10)
                        && application.data.occurredOn <= item.data.occurredOn)));
                if (!evolved.length || (command.outcome === 'RECOVERED' && evolved.length !== reportPrescriptions.length))
                    throw new Error('crop-health.errors.assessment-evidence');
                const existing = loadedAssessments.find(item => item.data.id === command.id);
                const assessment = new CaseAssessment({
                    ...command,
                    agronomistUserId: user.id,
                    evidenceIds: evidence.map(item => item.data.id).sort(),
                    recordedAt: existing?.data.recordedAt ?? new Date().toISOString()
                });
                if (existing && (existing.data.agronomistUserId !== user.id || existing.data.outcome !== assessment.data.outcome
                    || existing.data.notes !== assessment.data.notes
                    || JSON.stringify([...existing.data.evidenceIds].sort()) !== JSON.stringify(assessment.data.evidenceIds)))
                    throw new Error('crop-health.errors.assessment-conflict');
                if (found.status !== 'INSPECTED' && !(existing?.data.outcome === 'RECOVERED' && found.status === 'RESOLVED'))
                    throw new Error('crop-health.errors.invalid-transition');
                return withResponsibility(command.reportId, () => existing ? existing : assessmentApi.record(assessment.data))
                    .then(saved => {
                        assessmentSaved = true;
                        assessmentsState.value = [...assessmentsState.value.filter(item => item.data.id !== saved.data.id), saved];
                        if (saved.data.outcome !== 'RECOVERED' || found.status === 'RESOLVED') return found;
                        const resolved = copyReport(found);
                        resolved.resolve();
                        return withResponsibility(command.reportId, () => api.updateReport(resolved));
                    });
            });
        }, replaceReport, onSaved, onFailure,
            () => assessmentSaved ? 'crop-health.errors.assessment-partial' : 'crop-health.errors.save-assessment');
    }

    /**
     * Records farmer evidence for a prescription belonging to their own incident.
     * @param {{id: string, reportId: number, prescriptionId: number, kind: string, occurredOn: string, notes: string}} command - Stable client ID, prescription, date and notes; account is session-derived.
     * @param {function(): void} onSaved - Called after persisted confirmation in the same session.
     * @param {function(): void} onFailure - Restores editing while preserving the draft for a retry.
     */
    function recordFollowUp(command, onSaved, onFailure) {
        mutate(() => {
            const current = report(command.reportId);
            const user = activeUser.value;
            const prescription = prescriptions.value.find(item => item.id === command.prescriptionId && item.reportId === current.id);
            if (!canReport.value || !user || current.reporterId !== user.id
                || !plots.value.some(plot => plot.id === current.plotId && plot.ownerUserId === user.id)) denied();
            if (clinicalLoading.value || clinicalError.value || current.status !== 'INSPECTED' || !prescription)
                throw new Error('crop-health.errors.follow-up-not-ready');
            const evidence = new TreatmentFollowUp({ ...command, producerUserId: user.id, recordedAt: new Date().toISOString() });
            if (command.occurredOn > todayInLima() || command.occurredOn < prescription.applicationDate.slice(0, 10))
                throw new Error('crop-health.errors.follow-up-date');
            return followUpApi.getByReport(command.reportId).then(existing => {
                if (user !== activeUser.value || !scopeReady.value) denied();
                const matching = existing.filter(item => item.data.reportId === command.reportId
                    && item.data.prescriptionId === command.prescriptionId && item.data.producerUserId === user.id);
                const retried = matching.find(item => item.data.id === evidence.data.id);
                if (retried) {
                    if (retried.data.kind !== evidence.data.kind || retried.data.occurredOn !== evidence.data.occurredOn
                        || retried.data.notes !== evidence.data.notes) throw new Error('crop-health.errors.follow-up-conflict');
                    return retried;
                }
                const application = matching.find(item => item.data.kind === 'APPLICATION');
                if (command.kind === 'APPLICATION' && application) throw new Error('crop-health.errors.application-exists');
                if (command.kind === 'EVOLUTION' && (!application || command.occurredOn < application.data.occurredOn))
                    throw new Error('crop-health.errors.application-required');
                return followUpApi.record(evidence.data);
            });
        }, saved => followUpsState.value = [...followUpsState.value.filter(item => item.data.id !== saved.data.id), saved],
            onSaved, onFailure, 'crop-health.errors.save-follow-up');
    }

    /**
     * @param {number} id - Report.
     * @returns {boolean} `true` when the farmer can still delete their pending report.
     */
    function canDeleteReport(id) {
        const item = pestReports.value.find(candidate => candidate.id === id);
        return canReport.value && !clinicalLoading.value && !clinicalError.value && !!item
            && item.reporterId === activeUser.value?.id && item.status === 'PENDING'
            && !inspections.value.some(inspection => inspection.reportId === id)
            && !prescriptions.value.some(prescription => prescription.reportId === id);
    }

    /**
     * @param {number} id - Report to delete.
     * @param {function(): void} onSaved - Called after the API confirms.
     * @param {function(): void} onFailure - Called when it fails.
     */
    function deleteReport(id, onSaved, onFailure) {
        mutate(() => {
            if (!canDeleteReport(id)) denied();
            return api.deleteReport(id);
        }, () => reportsState.value = reportsState.value.filter(item => item.id !== id), onSaved, onFailure, 'crop-health.errors.delete-report');
    }

    /** Clears the error of the last write. */
    function clearError() {
        setError('write', null);
    }

    /**
     * @param {number} id - Report.
     * @returns {string} `#1 · Plot name`: number of the report inside the user's scope.
     */
    function reportLabel(id) {
        const sorted = [...pestReports.value].sort((a, b) => Number(a.id) - Number(b.id));
        const index = sorted.findIndex(item => Number(item.id) === id);
        return index >= 0 ? `#${index + 1} · ${sorted[index].plotName}` : `#${id}`;
    }

    /**
     * @param {number} id - Agronomist user.
     * @returns {string} Name of the agronomist.
     */
    function advisorName(id) {
        return advisors.value.find(item => item.userId === id)?.name
            ?? (session.currentUser?.id === id ? session.currentUser?.displayName : undefined)
            ?? `#${id}`;
    }

    /**
     * Requires producer application and evolution before offering professional evaluation.
     * @param {number} id - Report.
     * @returns {boolean} `true` when the agronomist can evaluate the case.
     */
    function canAssess(id) {
        return canPrescribe.value && !clinicalLoading.value && !clinicalError.value
            && pestReports.value.some(item => item.id === id && item.status === 'INSPECTED')
            && prescriptions.value.some(rx => rx.reportId === id
                && followUps.value.some(item => item.data.prescriptionId === rx.id && item.data.kind === 'APPLICATION')
                && followUps.value.some(item => item.data.prescriptionId === rx.id && item.data.kind === 'EVOLUTION'));
    }

    /**
     * @param {FieldInspection} inspection - Inspection.
     * @returns {boolean} `true` when the agronomist can complete it.
     */
    function canComplete(inspection) {
        return canPrescribe.value
            && pestReports.value.some(item => item.id === inspection.reportId && item.status === 'PENDING')
            && (inspection.status === 'SCHEDULED' || inspection.inspectorUserId === activeUser.value?.id);
    }

    function report(id) {
        const found = pestReports.value.find(item => item.id === id);
        if (!found) denied();
        return found;
    }

    function copyReport(source) {
        return new PestReport({
            id: source.id,
            plotId: source.plotId,
            plotName: source.plotName,
            reporterId: source.reporterId,
            description: source.description,
            severity: source.severity,
            status: source.status,
            photo: source.photo,
            clientSyncId: source.clientSyncId
        });
    }

    function replaceReport(updated) {
        reportsState.value = reportsState.value.map(item => item.id === updated.id ? updated : item);
    }

    function setBusy(key, value) {
        busy.value = { ...busy.value, [key]: value };
    }

    function setError(key, value) {
        errors.value = { ...errors.value, [key]: value };
    }

    /**
     * Runs a read; it replaces any previous request of the same key, and its
     * answer is dropped if the user changed meanwhile.
     */
    function read(key, source, onData, fallback) {
        const token = Symbol(key);
        requests.set(key, token);
        setBusy(key, true);
        setError(key, null);
        const started = epoch;
        const participant = activeUser.value;
        const isCurrent = () => started === epoch && participant === activeUser.value && requests.get(key) === token;
        source()
            .then(data => {
                if (!isCurrent()) return;
                setBusy(key, false);
                try {
                    onData(data);
                } catch (cause) {
                    setError(key, message(cause, fallback));
                }
            })
            .catch(cause => {
                if (!isCurrent()) return;
                setBusy(key, false);
                setError(key, message(cause, fallback));
            });
    }

    /** Runs a write; checks and request run in `source`, the saved data is applied with `update`. */
    function mutate(source, update, onSaved, onFailure, fallback) {
        if (saving.value) {
            onFailure();
            return;
        }
        clearError();
        const started = epoch;
        const participant = activeUser.value;
        const fail = cause => {
            setBusy('write', false);
            setError('write', message(cause, typeof fallback === 'string' ? fallback : fallback()));
            onFailure();
        };
        let operation;
        try {
            if (!scopeReady.value) denied();
            operation = source();
        } catch (cause) {
            fail(cause);
            return;
        }
        setBusy('write', true);
        Promise.resolve(operation)
            .then(data => {
                if (started !== epoch || participant !== activeUser.value) return;
                update(data);
                setBusy('write', false);
                onSaved();
            })
            .catch(cause => {
                if (started === epoch && participant === activeUser.value) fail(cause);
            });
    }

    function reset() {
        epoch++;
        requests.clear();
        busy.value = {};
        errors.value = {};
        ready.value = false;
        scopeUser.value = null;
        plotsState.value = [];
        advisorsState.value = [];
        advisorState.value = null;
        observationsState.value = [];
        reportsState.value = [];
        alertsState.value = [];
        followUpsState.value = [];
        assessmentsState.value = [];
        forecastsState.value = [];
        inspectionsState.value = [];
        prescriptionsState.value = [];
    }

    // Resolve the scope again every time the user changes.
    watch(activeUser, user => loadScope(user), { immediate: true });

    return {
        activeUser, scopeReady, plots, selectedPlot, observations, latestObservation, pestReports, alerts, forecasts,
        inspections, prescriptions, followUps, assessments, advisors, currentAdvisor, canReport, canSchedule,
        canPrescribe, saving, loading, scopeLoading, clinicalLoading, observationsLoading, alertsLoading, scopeError,
        clinicalError, observationsError, alertsError, writeError, error, pendingPestReportsCount, treatableReports,
        schedulableReports,
        producerName, retryScope, selectPlot, loadObservations, loadAlerts, loadClinicalData, recordReport,
        scheduleInspection, completeInspection, issuePrescription, recordAssessment, recordFollowUp, canDeleteReport,
        deleteReport, clearError, reportLabel, advisorName, canAssess, canComplete
    };
});

export default useCropHealthStore;
