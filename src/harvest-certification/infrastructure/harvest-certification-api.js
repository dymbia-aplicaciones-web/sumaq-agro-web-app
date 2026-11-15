import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const harvestBatchesEndpointPath       = import.meta.env.VITE_HARVEST_BATCHES_ENDPOINT_PATH || '/harvest-batches';
const qualityCertificatesEndpointPath  = import.meta.env.VITE_QUALITY_CERTIFICATES_ENDPOINT_PATH || '/quality-certificates';

/**
 * Infrastructure gateway for Harvest Certification bounded-context endpoints.
 * `/public-traceability` has no Fake API collection: the public page joins
 * the certificate and its batch instead (as the Angular app does).
 *
 * @class HarvestCertificationApi
 * @extends BaseApi
 */
export class HarvestCertificationApi extends BaseApi {
    #batchesEndpoint;
    #certificatesEndpoint;

    /** Creates endpoint clients for batches, certificates and cooperative members. */
    constructor() {
        super();
        this.#batchesEndpoint = new BaseEndpoint(this, harvestBatchesEndpointPath);
        this.#certificatesEndpoint = new BaseEndpoint(this, qualityCertificatesEndpointPath);
    }

    /** @param {number} cooperativeId - Cooperative. @returns {Promise<import('axios').AxiosResponse>} Batches. */
    getBatchesByCooperative(cooperativeId, memberId) {
        return this.#batchesEndpoint.getAllBy({ cooperativeId, memberId });
    }

    /** @param {number} id - Batch. @returns {Promise<import('axios').AxiosResponse>} One batch. */
    getBatchById(id) {
        return this.#batchesEndpoint.getById(id);
    }

    /** @param {Object} resource - Batch payload. @returns {Promise<import('axios').AxiosResponse>} Registered batch. */
    createBatch(resource) {
        return this.#batchesEndpoint.create(resource);
    }

    /** @param {Object} resource - Batch payload. @returns {Promise<import('axios').AxiosResponse>} Updated batch. */
    recordEvaluationStep(batchId, step, payload) {
        return this.http.post(`${harvestBatchesEndpointPath}/${batchId}/${step}`, payload);
    }

    getCertificateByBatch(batchId) {
        return this.http.get(`${qualityCertificatesEndpointPath}/batch/${batchId}`)
            .catch(error => {
                if (error.response?.status === 404) return null;
                throw error;
            });
    }

    downloadCertificate(id) {
        return this.http.get(`${qualityCertificatesEndpointPath}/${id}/document`, { responseType: 'blob' });
    }

    verifyCertificate(number, hash) {
        return this.http.get('/public/traceability', { params: { number, hash } })
            .then(response => response.data)
            .catch(error => {
                if (error.response?.status === 404) return null;
                throw error;
            });
    }

    /** @returns {Promise<import('axios').AxiosResponse>} All certificates. */
    getCertificates() {
        return this.#certificatesEndpoint.getAll();
    }

    /** @param {string} verificationToken - QR token. @returns {Promise<import('axios').AxiosResponse>} Matching certificates. */
    getCertificatesByToken(verificationToken) {
        return this.#certificatesEndpoint.getAllBy({ verificationToken });
    }

    /** @param {Object} resource - Certificate payload. @returns {Promise<import('axios').AxiosResponse>} Issued certificate. */
    createCertificate(resource) {
        return this.#certificatesEndpoint.create(resource);
    }


}
