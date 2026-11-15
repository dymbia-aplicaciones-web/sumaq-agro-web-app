import {installIamInterceptor} from '../../iam/infrastructure/iam.interceptor.js';
import axios from "axios";

const platformApi = import.meta.env.VITE_SUMAQAGRO_PLATFORM_API_URL || '/api/v1';

/**
 * Shared infrastructure base class that configures the HTTP client.
 * Points to the json-server Fake API until the SumaqAgro RESTful API is deployed.
 *
 * @class BaseApi
 */
export class BaseApi {
    /**
     * @private
     * Axios HTTP client instance
     * @type {import('axios').AxiosInstance}
     */
    #http;

    /**
     * Initializes the Axios HTTP client with the base URL from environment variables
     */
    constructor() {
        this.#http = axios.create({
            baseURL: platformApi,
            headers: {
                'Content-Type': 'application/json'
            },
        });
        installIamInterceptor(this.#http);
    }

    /**
     * Returns the configured Axios HTTP client.
     * @returns {import('axios').AxiosInstance}
     */
    get http() {
        return this.#http;
    }

}
