/**
 * Kinds of operation kept on the device while there is no connection.
 * @readonly
 * @enum {string}
 */
export const PendingOperationType = Object.freeze({
    FIELD_EXPENSE: 'FIELD_EXPENSE'
});

/**
 * An operation recorded without connection, waiting to be sent to the API.
 *
 * @typedef {Object} PendingOperation
 * @property {string} uuid - Code generated on the device; the API uses it to ignore duplicates.
 * @property {string} type - Kind of operation (`PendingOperationType`).
 * @property {Object} payload - Data of the operation, as the store saved it.
 * @property {string} createdAt - Date and time (ISO 8601) when it was recorded.
 */
