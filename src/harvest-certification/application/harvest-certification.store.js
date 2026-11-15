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
import {BatchStatus, CertificateStatus, HarvestCropType} from "../domain/model/harvest-certification.enums.js";
import {classifyQuality, validateEvaluation} from "../domain/model/quality-grading.js";
import {ProfilesApi} from "../../profiles/infrastructure/profiles-api.js";
import useIamStore from "../../iam/application/iam.store.js";

const harvestCertificationApi = new HarvestCertificationApi();

const profiles = new ProfilesApi();

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
            const ids = director ? (id === null ? [] : [id]) : [...new Set(active.map(member => member.cooperativeId))];
            const [collections, certificateResponse] = await Promise.all([
                Promise.all(ids.map(value => harvestCertificationApi.getBatchesByCooperative(value))),
                ids.length ? harvestCertificationApi.getCertificates() : null
            ]);
            if (revision !== request || iam.currentUser !== user) return;
            batches.value = collections.flatMap(response => HarvestBatchAssembler.toEntitiesFromResponse(response))
                .filter(batch => director ? batch.cooperativeId === id :
                    active.some(member => member.id === batch.memberId && member.cooperativeId === batch.cooperativeId));
            const batchIds = new Set(batches.value.map(batch => batch.id));
            certificates.value = certificateResponse ? QualityCertificateAssembler.toEntitiesFromResponse(certificateResponse)
                .filter(certificate => batchIds.has(certificate.harvestBatchId)) : [];
            members.value = active;
            cooperativeId.value = id;
            ready.value = true;
            if (director && id === null) notice.value = 'harvest-certification.scope.no-cooperative';
        } catch {
            if (revision === request) error.value = 'harvest-certification.scope.load-error';
        } finally {
            if (revision === request) loading.value = false;
        }
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
            code: `BATCH-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
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
        const { id, ...newBatch } = HarvestBatchAssembler.toResourceFromEntity(batch);
        const issuedAt = new Date().toISOString();
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify({ batch: newBatch, issuedAt })));
        return {
            batch,
            verificationToken: crypto.randomUUID(),
            sha256Hash: Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join(''),
            issuedAt,
            issuerName: iam.currentUser?.displayName
        };
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
            if (!draft.savedBatch) {
                const response = await harvestCertificationApi.createBatch(HarvestBatchAssembler.toResourceFromEntity(draft.batch));
                draft.savedBatch = HarvestBatchAssembler.toEntityFromResource(response.data);
                if (!current()) return null;
                batches.value = [draft.savedBatch, ...batches.value];
            }
            const saved = draft.savedBatch;
            if (!saved.canIssueCertificate) throw new Error('harvest-certification.errors.batch-not-graded');
            if (!draft.savedCertificate) {
                if (certificates.value.some(item => item.harvestBatchId === saved.id))
                    throw new Error('harvest-certification.errors.already-certified');
                const response = await harvestCertificationApi.createCertificate({
                    harvestBatchId: saved.id, certificateNumber: `CERT-${saved.code}`,
                    sha256Hash: draft.sha256Hash, verificationToken: draft.verificationToken,
                    issuedByUserId: issuer.id, issuedByName: issuer.displayName,
                    issuedAt: draft.issuedAt, status: CertificateStatus.ACTIVE, revokedReason: null
                });
                draft.savedCertificate = QualityCertificateAssembler.toEntityFromResource(response.data);
                if (!current()) return null;
                certificates.value = [draft.savedCertificate, ...certificates.value];
            }
            const response = await harvestCertificationApi.updateBatch({
                ...HarvestBatchAssembler.toResourceFromEntity(saved), status: BatchStatus.CERTIFIED
            });
            if (!current()) return null;
            const batch = HarvestBatchAssembler.toEntityFromResource(response.data);
            batches.value = batches.value.map(item => item.id === batch.id ? batch : item);
            return { certificate: draft.savedCertificate, batch };
        } catch {
            if (current()) error.value = draft.savedBatch
                ? 'harvest-certification.errors.issue-incomplete' : 'harvest-certification.errors.save-batch';
            return null;
        } finally {
            if (current()) loading.value = false;
        }
    }

    /**
     * Public verification of a certificate from its QR token: the token finds
     * the certificate and its `harvestBatchId` finds the batch.
     * @param {string} token - QR token.
     * @returns {Promise<{certificate: Object, batch: HarvestBatch|null}|null>} `null` when the token is unknown.
     */
    function verifyCertificate(token, number, hash) {
        if (number && hash) {
            return harvestCertificationApi.getPublicTraceability(number, hash)
                .then(traceability => ({traceability}))
                .catch(error => {
                    if (error.response?.status === 404) return null;
                    throw error;
                });
        }
        if (!token) return Promise.resolve(null);
        return harvestCertificationApi.getCertificatesByToken(token.trim())
            .then(response => {
                const [certificate] = QualityCertificateAssembler.toEntitiesFromResponse(response);
                if (!certificate) return null;
                if (!certificate.isActive()) return { certificate, batch: null };
                return harvestCertificationApi.getBatchById(certificate.harvestBatchId)
                    .then(batchResponse => ({ certificate, batch: HarvestBatchAssembler.toEntityFromResource(batchResponse.data) }));
            });
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
        verifyCertificate
    };
});

export default useHarvestCertificationStore;
