import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {FieldPlotAssembler} from "./assemblers/field-plot.assembler.js";
import {CropCampaignAssembler} from "./assemblers/crop-campaign.assembler.js";
import {CampaignLedgerAssembler} from "./assemblers/campaign-ledger.assembler.js";
import {FieldPlotsApiEndpoint} from "./endpoints/field-plots-api-endpoint.js";
import {CropCampaignsApiEndpoint} from "./endpoints/crop-campaigns-api-endpoint.js";
import {CampaignLedgersApiEndpoint} from "./endpoints/campaign-ledgers-api-endpoint.js";

/**
 * Infrastructure facade for field plot, crop campaign and cost ledger endpoint operations.
 * Every operation returns domain entities.
 *
 * @class FieldManagementApi
 * @extends BaseApi
 */
export class FieldManagementApi extends BaseApi {
    /** @type {FieldPlotsApiEndpoint} */
    #plotsEndpoint;
    /** @type {CropCampaignsApiEndpoint} */
    #campaignsEndpoint;
    /** @type {CampaignLedgersApiEndpoint} */
    #ledgersEndpoint;

    /** Creates endpoint clients for plots, campaigns and cost ledgers. */
    constructor() {
        super();
        this.#plotsEndpoint = new FieldPlotsApiEndpoint(this);
        this.#campaignsEndpoint = new CropCampaignsApiEndpoint(this);
        this.#ledgersEndpoint = new CampaignLedgersApiEndpoint(this);
    }

    // ---------- Field plots ----------

    /**
     * Retrieves the plots of one producer.
     * @param {number} ownerUserId - Producer who owns the plots.
     * @returns {Promise<import('../domain/model/entities/field-plot.entity.js').FieldPlot[]>} Plot collection.
     */
    getPlotsByOwner(ownerUserId) {
        return this.#plotsEndpoint.getByOwner(ownerUserId);
    }

    /**
     * Retrieves the plots with the given IDs; the ones that no longer exist are skipped.
     * @param {number[]} ids - The IDs of the plots.
     * @returns {Promise<import('../domain/model/entities/field-plot.entity.js').FieldPlot[]>} Plot collection.
     */
    getPlotsByIds(ids) {
        return this.#plotsEndpoint.getByIds(ids);
    }

    /**
     * Retrieves a single plot by ID.
     * @param {number} id - The ID of the plot.
     * @returns {Promise<import('../domain/model/entities/field-plot.entity.js').FieldPlot>} The plot.
     */
    getPlotById(id) {
        return this.#plotsEndpoint.getById(id).then(response => FieldPlotAssembler.toEntityFromResource(response.data));
    }

    /**
     * Creates a new plot.
     * @param {import('../domain/model/entities/field-plot.entity.js').FieldPlot} plot - The plot to create.
     * @returns {Promise<import('../domain/model/entities/field-plot.entity.js').FieldPlot>} The created plot.
     */
    createPlot(plot) {
        return this.#plotsEndpoint.create(FieldPlotAssembler.toResourceFromEntity(plot))
            .then(response => FieldPlotAssembler.toEntityFromResource(response.data));
    }

    /**
     * Updates an existing plot.
     * @param {import('../domain/model/entities/field-plot.entity.js').FieldPlot} plot - The plot to update.
     * @returns {Promise<import('../domain/model/entities/field-plot.entity.js').FieldPlot>} The updated plot.
     */
    updatePlot(plot) {
        return this.#plotsEndpoint.update(plot.id, FieldPlotAssembler.toResourceFromEntity(plot))
            .then(response => FieldPlotAssembler.toEntityFromResource(response.data));
    }

    /**
     * Deletes a plot by ID.
     * @param {number} id - The ID of the plot to delete.
     * @returns {Promise<void>}
     */
    deletePlot(id) {
        return this.#plotsEndpoint.delete(id).then(() => undefined);
    }

    // ---------- Crop campaigns ----------

    /**
     * Retrieves the campaigns of one plot.
     * @param {number} plotId - Plot where the campaigns take place.
     * @returns {Promise<import('../domain/model/entities/crop-campaign.entity.js').CropCampaign[]>} Campaign collection.
     */
    getCampaignsByPlot(plotId) {
        return this.#campaignsEndpoint.getByPlot(plotId);
    }

    /**
     * Creates a new campaign.
     * @param {import('../domain/model/entities/crop-campaign.entity.js').CropCampaign} campaign - The campaign to create.
     * @returns {Promise<import('../domain/model/entities/crop-campaign.entity.js').CropCampaign>} The created campaign.
     */
    createCampaign(campaign) {
        return this.#campaignsEndpoint.create(CropCampaignAssembler.toResourceFromEntity(campaign))
            .then(response => CropCampaignAssembler.toEntityFromResource(response.data));
    }

    /**
     * Updates an existing campaign.
     * @param {import('../domain/model/entities/crop-campaign.entity.js').CropCampaign} campaign - The campaign to update.
     * @returns {Promise<import('../domain/model/entities/crop-campaign.entity.js').CropCampaign>} The updated campaign.
     */
    updateCampaign(campaign) {
        return this.#campaignsEndpoint.update(campaign.id, CropCampaignAssembler.toResourceFromEntity(campaign))
            .then(response => CropCampaignAssembler.toEntityFromResource(response.data));
    }

    /**
     * Deletes a campaign by ID.
     * @param {number} id - The ID of the campaign to delete.
     * @returns {Promise<void>}
     */
    deleteCampaign(id) {
        return this.#campaignsEndpoint.delete(id).then(() => undefined);
    }

    /**
     * Downloads the cost report of a campaign.
     * @param {number} campaignId - Campaign of the report.
     * @returns {Promise<Blob>} The report file.
     */
    downloadCostReport(campaignId) {
        return this.#campaignsEndpoint.getCostReport(campaignId);
    }

    // ---------- Cost ledgers ----------

    /**
     * Retrieves the cost ledger of one campaign.
     * @param {number} campaignId - Campaign of the ledger.
     * @returns {Promise<import('../domain/model/entities/campaign-ledger.entity.js').CampaignLedger|null>}
     * The ledger, or `null` if the campaign has none.
     */
    getLedgerByCampaign(campaignId) {
        return this.#ledgersEndpoint.getByCampaign(campaignId);
    }

    /**
     * Retrieves a single cost ledger by ID.
     * @param {number} id - The ID of the ledger.
     * @returns {Promise<import('../domain/model/entities/campaign-ledger.entity.js').CampaignLedger>} The ledger.
     */
    getLedgerById(id) {
        return this.#ledgersEndpoint.getById(id).then(response => CampaignLedgerAssembler.toEntityFromResource(response.data));
    }

    /**
     * Creates a new cost ledger.
     * @param {import('../domain/model/entities/campaign-ledger.entity.js').CampaignLedger} ledger - The ledger to create.
     * @returns {Promise<import('../domain/model/entities/campaign-ledger.entity.js').CampaignLedger>} The created ledger.
     */
    createLedger(ledger) {
        return this.#ledgersEndpoint.create(CampaignLedgerAssembler.toResourceFromEntity(ledger))
            .then(response => CampaignLedgerAssembler.toEntityFromResource(response.data));
    }

    /**
     * Updates an existing cost ledger.
     * @param {import('../domain/model/entities/campaign-ledger.entity.js').CampaignLedger} ledger - The ledger to update.
     * @returns {Promise<import('../domain/model/entities/campaign-ledger.entity.js').CampaignLedger>} The updated ledger.
     */
    updateLedger(ledger) {
        return this.#ledgersEndpoint.update(ledger.id, CampaignLedgerAssembler.toResourceFromEntity(ledger))
            .then(response => CampaignLedgerAssembler.toEntityFromResource(response.data));
    }

    /**
     * Deletes a cost ledger by ID.
     * @param {number} id - The ID of the ledger to delete.
     * @returns {Promise<void>}
     */
    deleteLedger(id) {
        return this.#ledgersEndpoint.delete(id).then(() => undefined);
    }
}
