/**
 * Application service store for the Field Management bounded context
 * (Angular `FieldManagementStore`).
 *
 * @module useFieldManagementStore
 */
import {defineStore} from "pinia";
import {computed, ref, watch} from "vue";
import useIamStore from "../../iam/application/iam.store.js";
import {Money} from "../../shared/domain/model/money.js";
import {FileDownloader} from "../../shared/infrastructure/file-downloader.js";
import {RecordDailyLaborExpenseCommand} from "../domain/model/commands/record-daily-labor-expense.command.js";
import {RecordInputExpenseCommand} from "../domain/model/commands/record-input-expense.command.js";
import {CampaignLedger, YieldUnit} from "../domain/model/entities/campaign-ledger.entity.js";
import {CampaignStatus, CropCampaign, CropType} from "../domain/model/entities/crop-campaign.entity.js";
import {ExpenseCategory, ExpenseEntry} from "../domain/model/entities/expense-entry.entity.js";
import {FieldPlot, SoilBaseline} from "../domain/model/entities/field-plot.entity.js";
import {FieldManagementApi} from "../infrastructure/field-management-api.js";
import {PendingExpenseAssembler} from "../infrastructure/assemblers/pending-expense.assembler.js";
import {OfflineSync} from "../infrastructure/offline/offline-sync.js";
import {PendingOperationType} from "../infrastructure/offline/pending-operation.js";

/**
 * Plots included in the Seed plan (demo quota until subscriptions are implemented).
 * The quota belongs to Subscriptions and Payments; with the RESTful API,
 * Field Management asks for it before registering a plot.
 */
export const SEED_PLAN_PLOT_QUOTA = 4;

/**
 * Commands of a new campaign (US-32 to US-34, US-40). They follow the
 * EventStorming: start the campaign, select the crop, specify the variety and
 * record the sowing date. The campaign does not exist yet, so the
 * `campaignId` and `ledgerId` of these commands are ignored.
 *
 * @typedef {Object} CropCampaignSetup
 * @property {import('../domain/model/commands/start-crop-campaign.command.js').StartCropCampaignCommand} start
 * @property {import('../domain/model/commands/select-crop-type.command.js').SelectCropTypeCommand} cropType
 * @property {import('../domain/model/commands/specify-seed-variety.command.js').SpecifySeedVarietyCommand} seedVariety
 * @property {import('../domain/model/commands/record-sowing-date.command.js').RecordSowingDateCommand} sowingDate
 * @property {import('../domain/model/commands/set-expected-yield.command.js').SetExpectedYieldCommand} [expectedYield]
 */

const fieldManagementApi = new FieldManagementApi();
const offlineSync = new OfflineSync();
const fileDownloader = new FileDownloader();

/**
 * Runs a request again up to `retries` times when it fails (RxJS `retry(2)`).
 * @template T
 * @param {function(): Promise<T>} request - Request to run.
 * @param {number} [retries=2] - Extra attempts.
 * @returns {Promise<T>} Result of the first attempt that succeeds.
 */
const withRetry = (request, retries = 2) =>
    request().catch(error => retries > 0 ? withRetry(request, retries - 1) : Promise.reject(error));

/**
 * Campaign in progress, or the most recent one.
 * @param {CropCampaign[]} campaigns - Campaigns of a plot.
 * @returns {CropCampaign|undefined} Current campaign.
 */
const currentOf = (campaigns) => campaigns.find(campaign => campaign.status === CampaignStatus.IN_PROGRESS) ?? campaigns.at(-1);

/**
 * Holds the Field Management state and coordinates its application behavior.
 *
 * It keeps the producer's plots with their campaigns and cost ledgers, and the
 * selected plot. The views send commands and read the state. Every change is
 * applied to a copy of the aggregate; the shown state is only updated when the
 * API confirms. It also applies the policies of the context: P3 (link the
 * polygon to AgroMonitoring), P8 (open the cost ledger when a campaign starts)
 * and keeps the expenses recorded offline.
 *
 * @returns {Object} Store state and actions.
 */
const useFieldManagementStore = defineStore('field-management', () => {
    const iamStore = useIamStore();

    /** @type {import('vue').Ref<FieldPlot[]>} */
    const plotsState = ref([]);
    /** @type {import('vue').Ref<Map<number, CropCampaign[]>>} */
    const campaignsByPlot = ref(new Map());
    /** @type {import('vue').Ref<Map<number, CampaignLedger|null>>} Cost ledger of each campaign of the producer, by campaign identifier. */
    const ledgersByCampaign = ref(new Map());
    /** @type {import('vue').Ref<boolean>} `true` while the plots of the producer are being loaded. */
    const plotsLoading = ref(false);
    /** @type {import('vue').Ref<boolean>} `true` while data is being loaded from or saved to the API. */
    const loading = ref(false);
    /** @type {import('vue').Ref<string|null>} i18n key of the last error, or `null`. */
    const error = ref(null);
    /** @type {import('vue').Ref<number|null>} Identifier of the plot shown in Field Management and Crop Health, or `null`. */
    const selectedPlotId = ref(null);
    /** @type {import('vue').Ref<boolean>} `true` while the offline expenses are being synchronized. */
    const syncing = ref(false);
    const quotaOwner = ref(null);
    const quotaLoaded = ref(false);
    const plotMutationBusy = ref(false);
    /** @type {import('vue').Ref<boolean>} A saved plot whose initial campaign failed must be reviewed before another registration. */
    const registrationIncomplete = ref(false);
    // Increasing them makes the answers of older requests be ignored.
    let plotRevision = 0;
    let ledgersRequest = 0;

    /** Authenticated producer who owns the plots. */
    const currentUserId = computed(() => iamStore.currentRole === 'FARMER' ? iamStore.currentUserId : null);

    /** Plots of the producer. */
    const plots = computed(() => plotsState.value.filter(plot => plot.ownerUserId === currentUserId.value));

    /** `true` while the device has connection. */
    const online = computed(() => offlineSync.isOnline);

    /** Expenses recorded offline that are waiting to be synchronized. */
    const pendingExpenseCount = offlineSync.pendingCountOf(PendingOperationType.FIELD_EXPENSE);

    /** Number of plots of the producer. */
    const plotCount = computed(() => plots.value.length);

    /** Plots allowed by the plan of the producer. */
    const plotQuota = SEED_PLAN_PLOT_QUOTA;

    /** Quota is known only after a successful read for the currently selected producer. */
    const plotQuotaReady = computed(() =>
        currentUserId.value !== null && quotaOwner.value === currentUserId.value && quotaLoaded.value && !plotsLoading.value);

    /** Remaining slots never become negative, including legacy accounts above the quota. */
    const remainingPlotSlots = computed(() => Math.max(0, plotQuota - plotCount.value));

    /** Indicates an actual full plan, independently of loading or a failed quota check. */
    const plotQuotaReached = computed(() => plotQuotaReady.value && plotCount.value >= plotQuota);

    /** `true` only when a loaded producer has a free slot and no operation is in flight (US-22). */
    const canRegisterPlot = computed(() =>
        plotQuotaReady.value && remainingPlotSlots.value > 0 && !loading.value && !plotMutationBusy.value && !registrationIncomplete.value);

    /** Plot shown on the dashboard. */
    const selectedPlot = computed(() => plots.value.find(plot => plot.id === selectedPlotId.value));

    /** Campaigns of the selected plot. */
    const campaigns = computed(() => campaignsByPlot.value.get(selectedPlotId.value ?? -1) ?? []);

    /** Campaign in progress of the selected plot, or the most recent one. */
    const activeCampaign = computed(() => currentOf(campaigns.value));

    /** `true` when the selected plot has a campaign in progress. */
    const hasCampaignInProgress = computed(() => campaigns.value.some(campaign => campaign.isActive()));

    /** Cost ledger of the active campaign of the selected plot, or `null`. */
    const ledger = computed(() => {
        const campaign = activeCampaign.value;
        return campaign ? (ledgersByCampaign.value.get(campaign.id) ?? null) : null;
    });

    // ---------- Queries ----------

    /**
     * @param {number|string} id - Plot identifier.
     * @returns {FieldPlot|undefined} The plot of the producer with that identifier.
     */
    function getPlotById(id) {
        return plots.value.find(plot => plot.id === Number(id));
    }

    /**
     * @param {number} plotId - Plot identifier.
     * @returns {CropCampaign|undefined} Current campaign of a plot: the one in progress, or the most recent.
     */
    function getCurrentCampaignOf(plotId) {
        return currentOf(campaignsByPlot.value.get(Number(plotId)) ?? []);
    }

    /**
     * Loads the plots of the producer with their campaigns, and keeps (or selects) the shown plot.
     * @param {number} ownerUserId - Producer who owns the plots.
     */
    function loadMyPlots(ownerUserId) {
        if (ownerUserId !== currentUserId.value || (plotMutationBusy.value && quotaOwner.value === ownerUserId)) return;
        const revision = ++plotRevision;
        plotMutationBusy.value = false;
        quotaOwner.value = ownerUserId;
        quotaLoaded.value = false;
        registrationIncomplete.value = false;
        ++ledgersRequest;
        plotsLoading.value = true;
        startLoading();
        withRetry(() => fieldManagementApi.getPlotsByOwner(ownerUserId))
            .then(records => {
                const owned = ownedPlots(records, ownerUserId);
                return Promise.all(owned.map(plot => fieldManagementApi.getCampaignsByPlot(plot.id)))
                    .then(plotCampaigns => ({ owned, plotCampaigns }));
            })
            .then(({ owned, plotCampaigns }) => {
                if (!isPlotParticipant(ownerUserId, revision)) return;
                quotaLoaded.value = true;
                plotsLoading.value = false;
                plotsState.value = owned;
                campaignsByPlot.value = new Map(owned.map((plot, index) => [plot.id, plotCampaigns[index]]));
                loading.value = false;
                const keep = owned.some(plot => plot.id === selectedPlotId.value);
                const first = owned[0];
                if (first) selectPlot(keep ? selectedPlotId.value : first.id);
                else selectedPlotId.value = null;
            })
            .catch(cause => {
                if (!isPlotParticipant(ownerUserId, revision)) return;
                quotaLoaded.value = false;
                plotsLoading.value = false;
                fail(cause, 'field-management.errors.load-plots');
            });
    }

    /**
     * Shares the selected plot with Crop Health, which also shows the plots of
     * advisors and cooperatives that are not part of the producer's plots.
     * @param {number|null} plotId - Plot to show, or `null`.
     */
    function selectPlotId(plotId) {
        selectedPlotId.value = plotId;
    }

    /**
     * Selects a plot and loads the cost ledgers of its campaigns.
     * @param {number} plotId - Plot to show.
     */
    function selectPlot(plotId) {
        if (!plots.value.some(plot => plot.id === plotId)) return;
        const request = ++ledgersRequest;
        selectedPlotId.value = plotId;
        const plotCampaigns = campaignsByPlot.value.get(plotId) ?? [];
        if (plotCampaigns.length === 0) return;
        startLoading();
        Promise.all(plotCampaigns.map(campaign => withRetry(() => fieldManagementApi.getLedgerByCampaign(campaign.id))))
            .then(ledgers => {
                if (request !== ledgersRequest) return;
                const next = new Map(ledgersByCampaign.value);
                plotCampaigns.forEach((campaign, index) => next.set(campaign.id, ledgers[index]));
                ledgersByCampaign.value = next;
                loading.value = false;
            })
            .catch(cause => { if (request === ledgersRequest) fail(cause, 'field-management.errors.load-plot'); });
    }

    // ---------- FieldPlot aggregate ----------

    /**
     * Registers a plot "without polygon" with its first campaign and its cost ledger (US-28, US-32 to US-36).
     * Rechecks the owner-scoped quota before POST and serializes local mutations.
     * The backend must enforce the quota atomically across browsers and clients.
     * @param {import('../domain/model/commands/register-field-plot.command.js').RegisterFieldPlotCommand} command - Owner, name, region and declared area of the plot.
     * @param {CropCampaignSetup} setup - Commands of the first campaign.
     * @param {function(FieldPlot): void} [onRegistered] - Called with the new plot, to continue with its polygon.
     */
    function registerPlot(command, setup, onRegistered) {
        if (plotMutationBusy.value) return;
        const ownerUserId = currentUserId.value;
        if (ownerUserId === null || command.ownerUserId !== ownerUserId) {
            error.value = 'field-management.errors.plot-not-owned';
            return;
        }
        if (!canRegisterPlot.value) {
            error.value = plotQuotaReached.value ? 'field-management.errors.quota-reached' : 'field-management.errors.quota-unavailable';
            return;
        }
        let plot;
        try {
            plot = new FieldPlot({
                id: 0,
                ownerUserId: command.ownerUserId,
                name: command.name.trim(),
                region: command.region.trim(),
                areaHectares: command.declaredAreaHectares
            });
        } catch (cause) {
            fail(cause, 'field-management.errors.register-plot');
            return;
        }
        const revision = plotRevision;
        let created = false;
        let quotaChecked = false;
        let creationStarted = false;
        plotMutationBusy.value = true;
        startLoading();
        fieldManagementApi.getPlotsByOwner(ownerUserId)
            .then(records => {
                if (!isPlotParticipant(ownerUserId, revision)) throw new Error('field-management.errors.plot-not-owned');
                const owned = ownedPlots(records, ownerUserId);
                plotsState.value = owned;
                quotaChecked = true;
                if (owned.length >= plotQuota) throw new Error('field-management.errors.quota-reached');
                creationStarted = true;
                return fieldManagementApi.createPlot(plot);
            })
            .then(createdPlot => {
                if (!isPlotParticipant(ownerUserId, revision) || createdPlot.ownerUserId !== ownerUserId)
                    throw new Error('field-management.errors.plot-not-owned');
                created = true;
                // The slot is consumed as soon as the plot exists, even if its campaign later fails.
                plotsState.value = [...plotsState.value.filter(item => item.id !== createdPlot.id), createdPlot];
                campaignsByPlot.value = new Map(campaignsByPlot.value).set(createdPlot.id, []);
                return createCampaignWithLedger(createdPlot.id, setup).then(result => ({ createdPlot, ...result }));
            })
            .then(({ createdPlot, campaign, ledger: createdLedger }) => {
                if (!isPlotParticipant(ownerUserId, revision)) return;
                campaignsByPlot.value = new Map(campaignsByPlot.value).set(createdPlot.id, [campaign]);
                setLedger(campaign.id, createdLedger);
                plotMutationBusy.value = false;
                loading.value = false;
                selectPlot(createdPlot.id);
                onRegistered?.(createdPlot);
            })
            .catch(cause => {
                if (!isPlotParticipant(ownerUserId, revision)) return;
                plotMutationBusy.value = false;
                registrationIncomplete.value = created;
                // A lost POST response leaves an unknown count: refresh before attempting another write.
                if (!quotaChecked || (creationStarted && !created)) quotaLoaded.value = false;
                const key = created
                    ? 'field-management.errors.registration-partial'
                    : cause instanceof Error && cause.message.startsWith('field-management.errors.')
                        ? cause.message
                        : creationStarted
                            ? 'field-management.errors.registration-unconfirmed'
                            : 'field-management.errors.quota-check';
                fail(cause, key);
            });
    }

    /**
     * Saves the GPS polygon of a plot and its area (US-29), and links it to
     * AgroMonitoring so the satellite monitoring starts (policy P3, US-30).
     * @param {import('../domain/model/commands/delineate-plot-boundary.command.js').DelineatePlotBoundaryCommand} command - Plot and vertices of the polygon.
     * @param {function(FieldPlot): void} [onDelineated] - Called with the saved plot.
     */
    function delineateBoundary(command, onDelineated) {
        const current = findPlot(command.plotId);
        if (!current) return;
        const plot = copyPlot(current);
        try {
            plot.boundary = [...command.coordinates];
            plot.areaHectares = command.areaHectares;
        } catch (cause) {
            fail(cause, 'field-management.errors.invalid-polygon');
            return;
        }
        startLoading();
        withRetry(() => fieldManagementApi.updatePlot(plot))
            .then(updated => {
                replacePlot(updated);
                loading.value = false;
                onDelineated?.(updated);
            })
            .catch(cause => fail(cause, 'field-management.errors.save-polygon'));
    }

    /**
     * Records the initial soil analysis of a plot.
     * @param {import('../domain/model/commands/record-soil-baseline.command.js').RecordSoilBaselineCommand} command - pH, texture, organic matter and date of the analysis.
     * @param {function(): void} [onRecorded] - Called after the API confirms.
     */
    function recordSoilBaseline(command, onRecorded) {
        savePlot(command.plotId, plot => {
            plot.soilBaseline = new SoilBaseline({
                ph: command.ph,
                texture: command.texture,
                organicMatterPercentage: command.organicMatterPercentage,
                recordedAt: command.recordedAt
            });
        }, 'field-management.errors.save-soil', onRecorded);
    }

    /**
     * Deletes a plot by ID.
     * @param {number} id - The ID of the plot to delete.
     */
    function deletePlot(id) {
        if (plotMutationBusy.value || loading.value) return;
        const ownerUserId = currentUserId.value;
        const plot = findPlot(id);
        if (ownerUserId === null || !plotQuotaReady.value || !plot || plot.ownerUserId !== ownerUserId) {
            error.value = 'field-management.errors.plot-not-owned';
            return;
        }
        const revision = plotRevision;
        plotMutationBusy.value = true;
        startLoading();
        fieldManagementApi.getPlotById(id)
            .then(current => {
                if (!isPlotParticipant(ownerUserId, revision) || current.id !== id || current.ownerUserId !== ownerUserId)
                    throw new Error('field-management.errors.plot-not-owned');
                return deletePlotWithCampaigns(id);
            })
            .then(() => {
                if (!isPlotParticipant(ownerUserId, revision)) return;
                plotsState.value = plotsState.value.filter(item => item.id !== id);
                const nextCampaigns = new Map(campaignsByPlot.value);
                nextCampaigns.delete(id);
                campaignsByPlot.value = nextCampaigns;
                plotMutationBusy.value = false;
                loading.value = false;
                if (selectedPlotId.value === id) {
                    selectedPlotId.value = null;
                    const first = plots.value[0];
                    if (first) selectPlot(first.id);
                }
            })
            .catch(cause => {
                if (!isPlotParticipant(ownerUserId, revision)) return;
                plotMutationBusy.value = false;
                // Failed or ambiguous deletion never frees a local slot without confirmation.
                fail(cause, cause instanceof Error && cause.message === 'field-management.errors.plot-not-owned'
                    ? cause.message
                    : 'field-management.errors.delete-plot');
            });
    }

    // ---------- CropCampaign aggregate ----------

    /**
     * Starts a new campaign on a plot whose previous campaign is closed, and
     * opens its cost ledger (policy P8).
     * @param {CropCampaignSetup} setup - Commands of the new campaign.
     * @param {function(CropCampaign): void} [onStarted] - Called with the new campaign.
     */
    function startCampaign(setup, onStarted) {
        const plotId = setup.start.plotId;
        if (!findPlot(plotId)) return;
        startLoading();
        createCampaignWithLedger(plotId, setup)
            .then(({ campaign, ledger: createdLedger }) => {
                campaignsByPlot.value = new Map(campaignsByPlot.value)
                    .set(plotId, [...(campaignsByPlot.value.get(plotId) ?? []), campaign]);
                setLedger(campaign.id, createdLedger);
                loading.value = false;
                onStarted?.(campaign);
            })
            .catch(cause => fail(cause, 'field-management.errors.start-campaign'));
    }

    /**
     * Closes a campaign and freezes its cost ledger. When the producer knows
     * the harvest, it also records the actual yield.
     * @param {import('../domain/model/commands/close-crop-campaign.command.js').CloseCropCampaignCommand} command - Campaign to close.
     * @param {import('../domain/model/commands/record-actual-yield.command.js').RecordActualYieldCommand} [actualYield] - Harvested yield, if known.
     * @param {function(): void} [onClosed] - Called after the API confirms.
     */
    function closeCampaign(command, actualYield, onClosed) {
        const current = findCampaign(command.campaignId);
        if (!current) return;
        const campaign = copyCampaign(current);
        const currentLedger = ledgersByCampaign.value.get(command.campaignId) ?? null;
        const closedLedger = currentLedger ? copyLedger(currentLedger) : null;
        try {
            campaign.status = CampaignStatus.FINISHED;
            if (closedLedger && actualYield) closedLedger.actualYield = actualYield.actualYield;
            if (closedLedger) closedLedger.frozen = true;
        } catch (cause) {
            fail(cause, 'field-management.errors.close-campaign');
            return;
        }
        startLoading();
        withRetry(() => fieldManagementApi.updateCampaign(campaign))
            .then(savedCampaign => (closedLedger ? withRetry(() => fieldManagementApi.updateLedger(closedLedger)) : Promise.resolve(null))
                .then(savedLedger => ({ savedCampaign, savedLedger })))
            .then(({ savedCampaign, savedLedger }) => {
                replaceCampaign(savedCampaign);
                if (savedLedger) setLedger(savedCampaign.id, savedLedger);
                loading.value = false;
                onClosed?.();
            })
            .catch(cause => fail(cause, 'field-management.errors.close-campaign'));
    }

    // ---------- CampaignLedger aggregate ----------

    /**
     * Adds an expense to the ledger of the active campaign (US-37 to US-39).
     * Without connection the expense is kept on the device and shown at once;
     * it is synchronized when the connection comes back.
     * @param {RecordInputExpenseCommand|RecordDailyLaborExpenseCommand|import('../domain/model/commands/record-field-freight-expense.command.js').RecordFieldFreightExpenseCommand} command - Expense.
     * @param {function(): void} [onRecorded] - Called after the expense is kept.
     */
    function recordExpense(command, onRecorded) {
        if (!offlineSync.isOnline) {
            recordOffline(command, onRecorded);
            return;
        }
        saveLedger(command.ledgerId, copy => applyExpense(copy, command), 'field-management.errors.record-expense',
            onRecorded, () => recordOffline(command, onRecorded));
    }

    /**
     * Changes the expected yield, which updates the breakeven price (US-40).
     * @param {import('../domain/model/commands/set-expected-yield.command.js').SetExpectedYieldCommand} command - Ledger, yield and unit.
     */
    function setExpectedYield(command) {
        saveLedger(command.ledgerId, copy => {
            copy.expectedYield = command.expectedYield;
            copy.yieldUnit = command.unit;
        }, 'field-management.errors.save-yield');
    }

    /**
     * Records the harvested yield (policy P10); the breakeven price then uses it.
     * @param {import('../domain/model/commands/record-actual-yield.command.js').RecordActualYieldCommand} command - Ledger, yield and unit.
     * @param {function(): void} [onRecorded] - Called after the API confirms.
     */
    function recordActualYield(command, onRecorded) {
        saveLedger(command.ledgerId, copy => {
            copy.actualYield = command.actualYield;
        }, 'field-management.errors.save-actual-yield', onRecorded);
    }

    /**
     * Builds the cost report of a campaign and downloads it.
     * @param {import('../domain/model/commands/export-campaign-cost-report.command.js').ExportCampaignCostReportCommand} command - Campaign of the report.
     */
    function exportCostReport(command) {
        const campaign = findCampaign(command.campaignId);
        if (!campaign) {
            error.value = 'field-management.errors.export-report';
            return;
        }
        fieldManagementApi.downloadCostReport(command.campaignId)
            .then(content => fileDownloader.save({ fileName: `cost-report-${campaign.season}.pdf`, content }))
            .catch(cause => fail(cause, 'field-management.errors.export-report'));
    }

    /**
     * Sends the expenses recorded offline to the API, ledger by ledger.
     * The ledger ignores the expenses that were already saved.
     */
    function syncPendingExpenses() {
        if (syncing.value || !offlineSync.isOnline) return;
        const pending = offlineSync.pendingOf(PendingOperationType.FIELD_EXPENSE);
        const ledgerIds = [...new Set(pending.map(operation => operation.payload.ledgerId))];
        if (ledgerIds.length === 0) return;
        syncing.value = true;
        ledgerIds.reduce((chain, ledgerId) => chain.then(() => {
            const commands = pending
                .filter(operation => operation.payload.ledgerId === ledgerId)
                .map(operation => PendingExpenseAssembler.toCommand(operation));
            return fieldManagementApi.getLedgerById(ledgerId)
                .then(saved => {
                    const copy = copyLedger(saved);
                    commands.forEach(command => applyExpense(copy, command));
                    return fieldManagementApi.updateLedger(copy);
                })
                .then(updated => {
                    offlineSync.remove(commands.map(command => command.clientSyncId));
                    setLedger(updated.campaignId, updated);
                })
                // A ledger that fails (for example, it was deleted) does not stop the others.
                .catch(cause => console.error(cause));
        }), Promise.resolve())
            .finally(() => syncing.value = false);
    }

    // ---------- Campaign setup ----------

    /**
     * @param {string} cropType - Crop.
     * @returns {string} Unit of the yield of a crop: sacks for potato and quintals for coffee.
     */
    function yieldUnitOf(cropType) {
        return cropType === CropType.SPECIALTY_COFFEE ? YieldUnit.QUINTAL : YieldUnit.SACK;
    }

    /**
     * @param {Date} date - Date.
     * @returns {string} Agricultural season of a date: `YYYY-I` from January to June, `YYYY-II` from July.
     */
    function seasonOf(date) {
        return `${date.getFullYear()}-${date.getMonth() < 6 ? 'I' : 'II'}`;
    }

    // ---------- Helpers ----------

    /**
     * Deletes a plot with its campaigns and cost ledgers, one request at a time.
     * The RESTful API deletes them in cascade; the fake API does not, so the
     * store does it to avoid orphan campaigns. json-server rewrites its file on
     * every change, so the requests go one after the other.
     * @param {number} plotId - Plot to delete.
     * @returns {Promise<void>}
     */
    function deletePlotWithCampaigns(plotId) {
        return fieldManagementApi.getCampaignsByPlot(plotId)
            .then(plotCampaigns => plotCampaigns.reduce((chain, campaign) => chain
                .then(() => fieldManagementApi.getLedgerByCampaign(campaign.id))
                .then(found => found ? fieldManagementApi.deleteLedger(found.id) : undefined)
                .then(() => fieldManagementApi.deleteCampaign(campaign.id)), Promise.resolve()))
            .then(() => fieldManagementApi.deletePlot(plotId));
    }

    /**
     * Starts a campaign, applies its setup commands and opens its ledger (policy P8).
     * With the RESTful API the backend opens the ledger when it receives
     * `CropCampaignStarted`; with the fake API the store creates it.
     * @param {number} plotId - Plot of the campaign.
     * @param {CropCampaignSetup} setup - Commands of the campaign.
     * @returns {Promise<{campaign: CropCampaign, ledger: CampaignLedger}>} Created campaign and ledger.
     */
    function createCampaignWithLedger(plotId, setup) {
        let campaign;
        try {
            campaign = new CropCampaign({
                id: 0,
                plotId,
                season: setup.start.season.trim(),
                cropType: setup.cropType.cropType,
                seedVariety: setup.seedVariety.varietyName.trim(),
                customSeedVariety: setup.seedVariety.custom,
                sowingDate: setup.sowingDate.sowingDate
            });
        } catch (cause) {
            return Promise.reject(cause);
        }
        return fieldManagementApi.createCampaign(campaign).then(created => {
            // Policy P8: Whenever CropCampaignStarted Then OpenCampaignLedger.
            const newLedger = new CampaignLedger({ id: 0, campaignId: created.id, yieldUnit: yieldUnitOf(created.cropType) });
            if (setup.expectedYield) newLedger.expectedYield = setup.expectedYield.expectedYield;
            return fieldManagementApi.createLedger(newLedger).then(createdLedger => ({ campaign: created, ledger: createdLedger }));
        });
    }

    /**
     * Applies a change to a copy of a plot and saves it; the shown plot only
     * changes when the API confirms.
     * @param {number} plotId - Plot to change.
     * @param {function(FieldPlot): void} change - Change to apply.
     * @param {string} errorKey - i18n key of the failed operation.
     * @param {function(): void} [onSaved] - Called after the API confirms.
     * @returns {Promise<boolean>} `true` when saved.
     */
    function savePlot(plotId, change, errorKey, onSaved) {
        const current = findPlot(plotId);
        if (!current) return Promise.resolve(false);
        const plot = copyPlot(current);
        try {
            change(plot);
        } catch (cause) {
            fail(cause, errorKey);
            return Promise.resolve(false);
        }
        startLoading();
        return withRetry(() => fieldManagementApi.updatePlot(plot))
            .then(saved => {
                replacePlot(saved);
                loading.value = false;
                onSaved?.();
                return true;
            })
            .catch(cause => {
                fail(cause, errorKey);
                return false;
            });
    }

    /**
     * Applies a change to a copy of a ledger and saves it; the shown ledger
     * only changes when the API confirms.
     * @param {number} ledgerId - Ledger to change.
     * @param {function(CampaignLedger): void} change - Change to apply.
     * @param {string} errorKey - i18n key of the failed operation.
     * @param {function(): void} [onSaved] - Called after the API confirms.
     * @param {function(): void} [onOffline] - Called instead of failing when the connection was lost.
     */
    function saveLedger(ledgerId, change, errorKey, onSaved, onOffline) {
        const current = findLedger(ledgerId);
        if (!current) return;
        const copy = copyLedger(current);
        try {
            change(copy);
        } catch (cause) {
            fail(cause, errorKey);
            return;
        }
        startLoading();
        withRetry(() => fieldManagementApi.updateLedger(copy))
            .then(saved => {
                setLedger(saved.campaignId, saved);
                loading.value = false;
                onSaved?.();
            })
            .catch(cause => {
                if (onOffline && !offlineSync.isOnline) {
                    loading.value = false;
                    onOffline();
                    return;
                }
                fail(cause, errorKey);
            });
    }

    /** Keeps the expense on the device and shows it in the ledger until it is synchronized. */
    function recordOffline(command, onRecorded) {
        const current = findLedger(command.ledgerId);
        if (!current) return;
        const copy = copyLedger(current);
        try {
            applyExpense(copy, command);
        } catch (cause) {
            fail(cause, 'field-management.errors.record-expense');
            return;
        }
        offlineSync.enqueue(PendingExpenseAssembler.toOperation(command));
        setLedger(copy.campaignId, copy);
        error.value = null;
        onRecorded?.();
    }

    function findPlot(plotId) {
        return plots.value.find(plot => plot.id === plotId);
    }

    function findCampaign(campaignId) {
        for (const plotCampaigns of campaignsByPlot.value.values()) {
            const campaign = plotCampaigns.find(item => item.id === campaignId);
            if (campaign) return campaign;
        }
        return undefined;
    }

    function findLedger(ledgerId) {
        for (const item of ledgersByCampaign.value.values()) {
            if (item?.id === ledgerId) return item;
        }
        return undefined;
    }

    function replacePlot(plot) {
        plotsState.value = plotsState.value.map(item => item.id === plot.id ? plot : item);
    }

    function replaceCampaign(campaign) {
        const updated = (campaignsByPlot.value.get(campaign.plotId) ?? []).map(item => item.id === campaign.id ? campaign : item);
        campaignsByPlot.value = new Map(campaignsByPlot.value).set(campaign.plotId, updated);
    }

    function setLedger(campaignId, value) {
        ledgersByCampaign.value = new Map(ledgersByCampaign.value).set(campaignId, value);
    }

    /** Forgets the plots of the previous user (after signing out). */
    function clearState() {
        plotRevision++;
        ++ledgersRequest;
        plotMutationBusy.value = false;
        quotaLoaded.value = false;
        quotaOwner.value = null;
        registrationIncomplete.value = false;
        plotsLoading.value = false;
        loading.value = false;
        plotsState.value = [];
        campaignsByPlot.value = new Map();
        ledgersByCampaign.value = new Map();
        selectedPlotId.value = null;
        error.value = null;
    }

    /** Keeps quota counts account-scoped even if a demo endpoint returns unrelated rows. */
    function ownedPlots(records, ownerUserId) {
        return [...new Map(records.filter(plot => plot.ownerUserId === ownerUserId).map(plot => [plot.id, plot])).values()];
    }

    /** Rejects delayed responses from a previous account or an obsolete quota snapshot. */
    function isPlotParticipant(ownerUserId, revision) {
        return currentUserId.value === ownerUserId && plotRevision === revision;
    }

    function startLoading() {
        loading.value = true;
        error.value = null;
    }

    /**
     * Normalizes an error into an i18n key to show it in the view.
     * @param {unknown} cause - Source error.
     * @param {string} fallbackKey - i18n key of the failed operation.
     */
    function fail(cause, fallbackKey) {
        console.error(cause);
        error.value = fallbackKey;
        loading.value = false;
    }

    /**
     * Adds an expense command to a ledger: inputs (quantity × unit price),
     * labor (workers × days at the daily wage) or freight (one trip).
     * An expense already recorded with the same device code is ignored.
     */
    function applyExpense(target, command) {
        if (command instanceof RecordInputExpenseCommand)
            addExpense(target, ExpenseCategory.INPUTS, command.inputName, command.quantity, command.unitPrice, command);
        else if (command instanceof RecordDailyLaborExpenseCommand)
            addExpense(target, ExpenseCategory.LABOR, command.activity, command.workers * command.days, command.dailyWage, command);
        else addExpense(target, ExpenseCategory.FREIGHT, command.route, 1, command.cost, command);
    }

    function addExpense(target, category, description, quantity, unitPrice, command) {
        if (target.entries.some(entry => entry.clientSyncId === command.clientSyncId)) return;
        const nextId = Math.max(0, ...target.entries.map(entry => entry.id)) + 1;
        target.entries = [
            ...target.entries,
            new ExpenseEntry({
                id: nextId,
                ledgerId: target.id,
                category,
                description: description.trim(),
                quantity,
                unitPrice: new Money(unitPrice, target.currency),
                expenseDate: command.expenseDate,
                clientSyncId: command.clientSyncId
            })
        ];
    }

    /** Copies of the entities, changed before the API confirms. */
    function copyPlot(plot) {
        return new FieldPlot({
            id: plot.id,
            ownerUserId: plot.ownerUserId,
            name: plot.name,
            region: plot.region,
            status: plot.status,
            boundary: [...plot.boundary],
            areaHectares: plot.areaHectares,
            agroMonitoringPolygonId: plot.agroMonitoringPolygonId,
            soilBaseline: plot.soilBaseline
        });
    }

    function copyCampaign(campaign) {
        return new CropCampaign({
            id: campaign.id,
            plotId: campaign.plotId,
            season: campaign.season,
            cropType: campaign.cropType,
            seedVariety: campaign.seedVariety,
            customSeedVariety: campaign.customSeedVariety,
            sowingDate: campaign.sowingDate,
            status: campaign.status
        });
    }

    function copyLedger(source) {
        return new CampaignLedger({
            id: source.id,
            campaignId: source.campaignId,
            entries: [...source.entries],
            expectedYield: source.expectedYield,
            actualYield: source.actualYield,
            yieldUnit: source.yieldUnit,
            frozen: source.frozen,
            currency: source.currency
        });
    }

    // Load the plots of the producer every time the signed-in user changes.
    watch(currentUserId, userId => userId === null ? clearState() : loadMyPlots(userId), { immediate: true });
    // Synchronize the offline expenses every time the connection comes back.
    watch(() => offlineSync.isOnline && pendingExpenseCount.value > 0, ready => { if (ready) syncPendingExpenses(); }, { immediate: true });

    return {
        plots,
        plotsLoading,
        loading,
        error,
        online,
        pendingExpenseCount,
        syncing,
        currentUserId,
        plotCount,
        plotQuota,
        plotQuotaReady,
        remainingPlotSlots,
        plotQuotaReached,
        registrationIncomplete,
        canRegisterPlot,
        selectedPlotId,
        selectedPlot,
        campaigns,
        activeCampaign,
        hasCampaignInProgress,
        ledger,
        ledgersByCampaign,
        getPlotById,
        getCurrentCampaignOf,
        loadMyPlots,
        selectPlotId,
        selectPlot,
        registerPlot,
        delineateBoundary,
        recordSoilBaseline,
        deletePlot,
        startCampaign,
        closeCampaign,
        recordExpense,
        setExpectedYield,
        recordActualYield,
        exportCostReport,
        syncPendingExpenses,
        yieldUnitOf,
        seasonOf
    };
});

export default useFieldManagementStore;
