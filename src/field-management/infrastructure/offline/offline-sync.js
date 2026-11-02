import {computed, ref} from "vue";

const STORAGE_KEY = 'sumaq-agro-pending-operations';

/**
 * Keeps on the device the expenses recorded without connection (TS-05) until
 * the store sends them to the API, and tells whether the device is connected.
 * The `uuid` lets the API ignore an expense that was already saved.
 *
 * @class OfflineSync
 */
export class OfflineSync {
    /** @type {import('vue').Ref<boolean>} */
    #online = ref(typeof navigator === 'undefined' ? true : navigator.onLine);
    /** @type {import('vue').Ref<import('./pending-operation.js').PendingOperation[]>} */
    #operations = ref(OfflineSync.#read());

    /** Listens to the connection changes of the browser. */
    constructor() {
        if (typeof window === 'undefined') return;
        const update = () => this.#online.value = navigator.onLine;
        window.addEventListener('online', update);
        window.addEventListener('offline', update);
    }

    /** @returns {boolean} `true` while the device has connection. */
    get isOnline() {
        return this.#online.value;
    }

    /** @returns {number} Number of operations waiting to be synchronized, of any type. */
    get pendingCount() {
        return this.#operations.value.length;
    }

    /**
     * Keeps an operation on the device.
     * @param {import('./pending-operation.js').PendingOperation} operation - The operation recorded without connection.
     */
    enqueue(operation) {
        this.#write([...this.#operations.value, operation]);
    }

    /**
     * Pending operations of one type, in the order they were recorded.
     * @param {string} type - Kind of operation.
     * @returns {import('./pending-operation.js').PendingOperation[]} Pending operations.
     */
    pendingOf(type) {
        return this.#operations.value.filter(operation => operation.type === type);
    }

    /**
     * Number of pending operations of one type, as a computed value.
     * @param {string} type - Kind of operation.
     * @returns {import('vue').ComputedRef<number>} Pending count.
     */
    pendingCountOf(type) {
        return computed(() => this.#operations.value.filter(operation => operation.type === type).length);
    }

    /**
     * Forgets the operations already saved in the API.
     * @param {string[]} uuids - Device codes of the synchronized operations.
     */
    remove(uuids) {
        this.#write(this.#operations.value.filter(operation => !uuids.includes(operation.uuid)));
    }

    #write(operations) {
        this.#operations.value = operations;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(operations));
        } catch {
            // Without storage the operations stay in memory until the page closes.
        }
    }

    static #read() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
        } catch {
            return [];
        }
    }
}
