import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {PestReport} from "../domain/model/entities/pest-report.entity.js";
import {FieldInspection} from "../domain/model/entities/field-inspection.entity.js";
import {TechnicalPrescription} from "../domain/model/entities/technical-prescription.entity.js";
import {PestReportAssembler} from "./assemblers/pest-report.assembler.js";
import {FieldInspectionAssembler} from "./assemblers/field-inspection.assembler.js";
import {TechnicalPrescriptionAssembler} from "./assemblers/technical-prescription.assembler.js";
import {AgroclimaticAlertsApiEndpoint} from "./endpoints/agroclimatic-alert.endpoint.js";
import {ClimateForecastsApiEndpoint} from "./endpoints/climate-forecast.endpoint.js";
import {PestReportsApiEndpoint} from "./endpoints/pest-report.endpoint.js";
import {FieldInspectionsApiEndpoint} from "./endpoints/field-inspection.endpoint.js";
import {SatelliteObservationsApiEndpoint} from "./endpoints/satellite-observation.endpoint.js";
import {TechnicalPrescriptionsApiEndpoint} from "./endpoints/technical-prescription.endpoint.js";

/**
 * Facade of the Crop Health infrastructure. It groups all endpoints related to
 * crop health monitoring so the application layer only depends on this single
 * class. Every operation returns domain entities.
 *
 * @class CropHealthApi
 * @extends BaseApi
 */
export class CropHealthApi extends BaseApi {
    #alertsEndpoint;
    #forecastsEndpoint;
    #reportsEndpoint;
    #inspectionsEndpoint;
    #observationsEndpoint;
    #prescriptionsEndpoint;

    /** Creates endpoint clients for every Crop Health resource. */
    constructor() {
        super();
        this.#alertsEndpoint = new AgroclimaticAlertsApiEndpoint(this);
        this.#forecastsEndpoint = new ClimateForecastsApiEndpoint(this);
        this.#reportsEndpoint = new PestReportsApiEndpoint(this);
        this.#inspectionsEndpoint = new FieldInspectionsApiEndpoint(this);
        this.#observationsEndpoint = new SatelliteObservationsApiEndpoint(this);
        this.#prescriptionsEndpoint = new TechnicalPrescriptionsApiEndpoint(this);
    }

    /** @param {number} plotId - Plot. @returns {Promise<Array>} Satellite observations of the plot. */
    getObservationsByPlot(plotId) {
        return this.#observationsEndpoint.getByPlot(plotId);
    }

    /** @param {number} plotId - Plot. @returns {Promise<PestReport[]>} Pest reports of the plot. */
    getPestReportsByPlot(plotId) {
        return this.#reportsEndpoint.getByPlot(plotId);
    }

    /** @param {number} id - Report. @returns {Promise<void>} */
    deleteReport(id) {
        return this.#reportsEndpoint.delete(id).then(() => undefined);
    }

    /** @param {string} region - Region. @returns {Promise<Array>} Agroclimatic alerts of the region. */
    getAlertsByRegion(region) {
        return this.#alertsEndpoint.getByRegion(region);
    }

    /** @param {string} region - Region. @returns {Promise<Array>} Climate forecasts of the region. */
    getForecastsByRegion(region) {
        return this.#forecastsEndpoint.getByRegion(region);
    }

    /** @param {number} reportId - Report. @returns {Promise<FieldInspection[]>} Inspections of the report. */
    getInspectionsByReportId(reportId) {
        return this.#inspectionsEndpoint.getByReportId(reportId);
    }

    /** @param {number} reportId - Report. @returns {Promise<TechnicalPrescription[]>} Prescriptions of the report. */
    getPrescriptionsByReportId(reportId) {
        return this.#prescriptionsEndpoint.getByReportId(reportId);
    }

    /** @returns {Promise<PestReport[]>} All pest reports. */
    getReports() {
        return this.#reportsEndpoint.getAll().then(response => PestReportAssembler.toEntitiesFromResponse(response));
    }

    /** @returns {Promise<FieldInspection[]>} All field inspections. */
    getInspections() {
        return this.#inspectionsEndpoint.getAll().then(response => FieldInspectionAssembler.toEntitiesFromResponse(response));
    }

    /** @returns {Promise<TechnicalPrescription[]>} All technical prescriptions. */
    getPrescriptions() {
        return this.#prescriptionsEndpoint.getAll().then(response => TechnicalPrescriptionAssembler.toEntitiesFromResponse(response));
    }

    /**
     * @param {import('../domain/model/commands/record-pest-report.command.js').RecordPestReportCommand} command - Report data.
     * @returns {Promise<PestReport>} Created report.
     */
    recordReport(command) {
        return this.#reportsEndpoint.create(PestReportAssembler.toResourceFromEntity(new PestReport({ ...command })))
            .then(response => PestReportAssembler.toEntityFromResource(response.data));
    }

    /**
     * @param {import('../domain/model/commands/schedule-field-inspection.command.js').ScheduleFieldInspectionCommand} command - Visit data.
     * @returns {Promise<FieldInspection>} Created inspection.
     */
    scheduleInspection(command) {
        return this.#inspectionsEndpoint.create(FieldInspectionAssembler.toResourceFromEntity(new FieldInspection({ ...command })))
            .then(response => FieldInspectionAssembler.toEntityFromResource(response.data));
    }

    /**
     * @param {import('../domain/model/commands/issue-technical-prescription.command.js').IssueTechnicalPrescriptionCommand} command - Prescription data.
     * @returns {Promise<TechnicalPrescription>} Created prescription.
     */
    issuePrescription(command) {
        return this.#prescriptionsEndpoint.create(TechnicalPrescriptionAssembler.toResourceFromEntity(new TechnicalPrescription({ ...command })))
            .then(response => TechnicalPrescriptionAssembler.toEntityFromResource(response.data));
    }

    /** @param {PestReport} report - Report to save. @returns {Promise<PestReport>} Saved report. */
    updateReport(report) {
        return this.#reportsEndpoint.update(report.id, PestReportAssembler.toResourceFromEntity(report))
            .then(response => PestReportAssembler.toEntityFromResource(response.data));
    }

    /** @param {FieldInspection} inspection - Inspection to save. @returns {Promise<FieldInspection>} Saved inspection. */
    updateInspection(inspection) {
        return this.#inspectionsEndpoint.update(inspection.id, FieldInspectionAssembler.toResourceFromEntity(inspection))
            .then(response => FieldInspectionAssembler.toEntityFromResource(response.data));
    }
}
