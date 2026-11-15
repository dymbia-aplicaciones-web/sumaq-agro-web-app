/**
 * Application service store for the Harvest Certification bounded context
 * (Angular `HarvestCertificationStore`): batches, certificates and members of
 * the cooperative, the certificate preview and the public QR verification.
 *
 * @module useHarvestCertificationStore
 */
import {defineStore} from "pinia";
import {computed, ref, watch} from "vue";
import {HarvestCertificationApi} from "../infrastructure/harvest-certification-api.js";
import {HarvestBatchAssembler} from "../infrastructure/harvest-batch.assembler.js";
import {QualityCertificateAssembler} from "../infrastructure/quality-certificate.assembler.js";
import {HarvestBatch} from "../domain/model/harvest-batch.entity.js";
import {BatchStatus, HarvestCropType} from "../domain/model/harvest-certification.enums.js";
import {classifyQuality, validateEvaluation} from "../domain/model/quality-grading.js";
import {FieldManagementApi} from "../../field-management/infrastructure/field-management-api.js";
import {ProfilesApi} from "../../profiles/infrastructure/profiles-api.js";
import useIamStore from "../../iam/application/iam.store.js";

const harvestCertificationApi = new HarvestCertificationApi();

const profiles = new ProfilesApi();
const fields = new FieldManagementApi();

/**
 * Reactive store that exposes Harvest Certification commands and queries.
 *
 * @returns {Object} Store state and actions.
 */
const useHarvestCertificationStore = defineStore('harvest-certification', () => {
    /** @type {import('vue').Ref<HarvestBatch[]>} */
    const batches = ref([]);
    /** @type {import('vue').Ref<import('../domain/model/quality-certificate.entity.js').QualityCertificate[]>} */
    const certificates = ref([]);
    /** @type {import('vue').Ref<Array<{id: number, name: string, plots: Array<Object>}>>} Members with their plots. */
    const members = ref([]);
    const loading = ref(false);
    /** @type {import('vue').Ref<string|null>} i18n key or message of the last error. */
    const error = ref(null);
    /** Certificates that are still valid. */
    const activeCertificates = computed(() => certificates.value.filter(item => item.isActive()));

    const iam = useIamStore();
    const cooperativeId = ref(null);
    const ready = ref(false);
    const notice = ref(null);
    const canIssue = computed(() => ready.value && cooperativeId.value !== null &&
        iam.currentRole === 'COOPERATIVE_DIRECTOR');
    let revision = 0;

    async function load() {
        const request = ++revision;
        const user = iam.currentUser;
        cooperativeId.value = null;
        batches.value = [];
        certificates.value = [];
        members.value = [];
        error.value = null;
        notice.value = null;
        ready.value = false;
        loading.value = false;
        if (!['FARMER', 'COOPERATIVE_DIRECTOR'].includes(user?.experience)) return;
        loading.value = true;
        try {
            const director = user.experience === 'COOPERATIVE_DIRECTOR';
            const organization = director ? await profiles.getCooperativeByDirector(user.id) : null;
            const id = organization?.directorUserId === user.id ? organization.id : null;
            const scopedMembers = director
                ? (id === null ? [] : await profiles.getCooperativeMembers(id))
                : await profiles.getMembershipsByUser(user.id);
            const active = scopedMembers.filter(member => member.active &&
                (director ? member.cooperativeId === id : member.userId === user.id));
            const collections = director
                ? (id === null ? [] : [await harvestCertificationApi.getBatchesByCooperative(id)])
                : await Promise.all(active.map(member => harvestCertificationApi.getBatchesByCooperative(member.cooperativeId, member.id)));
            const loadedBatches = collections.flatMap(response => HarvestBatchAssembler.toEntitiesFromResponse(response));
            const [loadedMembers, loadedCertificates] = await Promise.all([
                Promise.all(active.map(loadMemberPlots)),
                Promise.all(loadedBatches.filter(batch => batch.status === BatchStatus.CERTIFIED)
                    .map(batch => harvestCertificationApi.getCertificateByBatch(batch.id)))
            ]);
            if (revision !== request || iam.currentUser !== user) return;
            batches.value = loadedBatches.map(batch => {
                const member = loadedMembers.find(item => item.id === batch.memberId);
                const plot = member?.plots.find(item => item.id === batch.plotId);
                return Object.assign(batch, {
                    memberName: member?.name ?? '', plotName: plot?.name ?? '',
                    plotRegion: plot?.region ?? '', variety: plot?.variety ?? ''
                });
            });
            certificates.value = loadedCertificates.filter(Boolean)
                .map(response => QualityCertificateAssembler.toEntityFromResource(response.data));
            members.value = loadedMembers;
            cooperativeId.value = id;
            ready.value = true;
            if (director && id === null) notice.value = 'harvest-certification.scope.no-cooperative';
        } catch {
            if (revision === request) error.value = 'harvest-certification.scope.load-error';
        } finally {
            if (revision === request) loading.value = false;
        }
    }

    async function loadMemberPlots(member) {
        if (!member.userId) return member;
        const plots = await fields.getPlotsByOwner(member.userId);
        member.plots = (await Promise.all(plots.map(async plot => {
            const campaigns = await fields.getCampaignsByPlot(plot.id);
            const campaign = campaigns.filter(item => Object.values(HarvestCropType).includes(item.cropType))
                .sort((a, b) => b.sowingDate.localeCompare(a.sowingDate))[0];
            return campaign && {
                id: plot.id, name: plot.name, region: plot.region, campaignId: campaign.id,
                cropType: campaign.cropType, variety: campaign.customSeedVariety || campaign.seedVariety
            };
        }))).filter(Boolean);
        return member;
    }

    watch(() => iam.currentUser, load, { flush: 'sync' });

    /**
     * Validates the intake and grading sheet and builds the certificate preview:
     * quality category, SHA-256 fingerprint and QR token.
     * @param {Object} form - memberId, plotId, weights and grading of the dialog.
     * @returns {Promise<{batch: HarvestBatch, verificationToken: string, sha256Hash: string, issuedAt: string}|{key: string, params?: Object}>}
     * The draft, or the validation error.
     */
    async function prepareDraft(form) {
        if (!canIssue.value) return { key: 'harvest-certification.scope.not-authorized' };
        const member = members.value.find(item => item.id === form.memberId);
        const plot = member?.plots.find(item => item.id === form.plotId);
        if (!member || !plot) return { key: 'harvest-certification.errors.select-member-plot' };
        const evaluation = { ...form, cropType: plot.cropType };
        const invalid = validateEvaluation(evaluation);
        if (invalid) return invalid;
        const isPotato = plot.cropType === HarvestCropType.ANDEAN_POTATO;
        const batch = new HarvestBatch({
            id: 0,
            code: `BATCH-${crypto.randomUUID().replaceAll('-', '').slice(0, 22)}`,
            cooperativeId: cooperativeId.value,
            memberId: member.id,
            memberName: member.name,
            plotId: plot.id,
            plotName: plot.name,
            plotRegion: plot.region,
            coordinates: plot.coordinates,
            campaignId: plot.campaignId,
            cropType: plot.cropType,
            variety: plot.variety,
            collectedAt: new Date().toISOString().slice(0, 10),
            grossKg: form.grossKg,
            tareKg: form.tareKg,
            sampleKg: form.sampleKg,
            potatoGrading: isPotato ? {
                firstPercentage: form.firstPercentage, secondPercentage: form.secondPercentage,
                thirdPercentage: form.thirdPercentage, weevilDamagePercentage: form.weevilDamagePercentage
            } : null,
            coffeeCupping: isPotato ? null : { aroma: 0, flavor: 0, acidity: 0, body: 0, totalScore: form.scaScore },
            qualityCategory: classifyQuality(evaluation),
            status: BatchStatus.GRADED
        });
        return { batch, issuedAt: new Date().toISOString(), issuerName: iam.currentUser?.displayName };
    }

    /**
     * Registers the graded batch, issues its certificate and marks the batch as
     * certified (the Fake API needs a second request to update the batch status).
     * @param {Object} draft - Draft built by `prepareDraft`.
     * @returns {Promise<{certificate: Object|null, batch: HarvestBatch}|null>} Issued certificate and batch.
     */
    async function issue(draft) {
        if (loading.value) return null;
        const issuer = iam.currentUser;
        const request = revision;
        const current = () => revision === request && iam.currentUser === issuer;
        if (!canIssue.value || draft.batch.cooperativeId !== cooperativeId.value ||
            !members.value.some(member => member.id === draft.batch.memberId &&
                member.plots.some(plot => plot.id === draft.batch.plotId && plot.campaignId === draft.batch.campaignId))) {
            error.value = 'harvest-certification.scope.not-authorized';
            return null;
        }
        loading.value = true;
        error.value = null;
        try {
            const input = draft.batch;
            const listed = await harvestCertificationApi.getBatchesByCooperative(input.cooperativeId);
            if (!current()) return null;
            let saved = listed.data.find(batch => batch.batchCode === input.code);
            if (!saved) {
                const response = await harvestCertificationApi.createBatch({
                    batchCode: input.code, cooperativeId: input.cooperativeId, memberId: input.memberId,
                    plotId: input.plotId, cropType: input.cropType, harvestedOn: input.collectedAt
                });
                saved = response.data;
            }
            draft.savedBatch = saved;
            const step = async (name, payload) => {
                if (!current()) throw new Error('Session changed');
                saved = (await harvestCertificationApi.recordEvaluationStep(saved.id, name, payload)).data;
                draft.savedBatch = saved;
            };
            if (saved.netWeightKg == null)
                await step('weight', { grossWeightKg: input.grossKg, tareKg: input.tareKg });
            if (saved.sampleIdentifier == null)
                await step('sample', { sampleIdentifier: `S-${input.code}`, sampleWeightKg: input.sampleKg });
            if (saved.status === 'PENDING') {
                if (input.potatoGrading) {
                    const { weevilDamagePercentage, ...grades } = input.potatoGrading;
                    await step('potato-calibers', { ...grades, pestDamagePercentage: weevilDamagePercentage });
                } else {
                    await step('coffee-cupping', { ...input.coffeeCupping, fermentDefect: false });
                }
            }
            if (!current()) return null;
            const response = saved.status === BatchStatus.CERTIFIED
                ? await harvestCertificationApi.getCertificateByBatch(saved.id)
                : await harvestCertificationApi.createCertificate({
                    harvestBatchId: saved.id, certificateNumber: `CERT-${input.code}`, issuedByUserId: issuer.id
                });
            if (!response || !current()) return null;
            const certificate = QualityCertificateAssembler.toEntityFromResource({
                ...response.data, issuedByName: issuer.displayName
            });
            const batch = Object.assign(HarvestBatchAssembler.toEntityFromResource(saved), {
                status: BatchStatus.CERTIFIED, memberName: input.memberName, plotName: input.plotName,
                plotRegion: input.plotRegion, variety: input.variety, coordinates: input.coordinates
            });
            batches.value = [batch, ...batches.value.filter(item => item.id !== batch.id)];
            certificates.value = [certificate, ...certificates.value.filter(item => item.id !== certificate.id)];
            return { certificate, batch };
        } catch {
            if (current()) error.value = draft.savedBatch
                ? 'harvest-certification.errors.issue-incomplete' : 'harvest-certification.errors.save-batch';
            return null;
        } finally {
            if (current()) loading.value = false;
        }
    }

    function verifyCertificate(number, hash) {
        if (!number || !/^[a-f0-9]{64}$/i.test(hash)) return Promise.resolve(null);
        return harvestCertificationApi.verifyCertificate(number, hash);
    }

    async function downloadCertificate(certificate) {
        const response = await harvestCertificationApi.downloadCertificate(certificate.id);
        const url = URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${certificate.certificateNumber}.pdf`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    return {
        batches,
        certificates,
        members,
        loading,
        error,
        activeCertificates,
        canIssue,
        notice,
        load,
        prepareDraft,
        issue,
        verifyCertificate,
        downloadCertificate
    };
});

export default useHarvestCertificationStore;
