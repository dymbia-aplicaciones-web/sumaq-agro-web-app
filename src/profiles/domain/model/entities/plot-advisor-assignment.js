/**
 * Previous responsibility retained when a producer changes the assigned professional.
 *
 * @typedef {Object} AdvisorAssignmentHistory
 * @property {number} advisorUserId
 * @property {string} assignedAt
 * @property {string} endedAt
 */

/**
 * Current demo authorization for one producer-owned plot.
 * Account IDs are explicit and independent of professional record IDs. One record
 * per plot stores the current responsible advisor and preserves previous periods.
 * Production must enforce ownership, advisor consent and uniqueness in the API.
 *
 * @typedef {Object} PlotAdvisorAssignment
 * @property {number} id
 * @property {number} plotId
 * @property {number} producerUserId
 * @property {number} advisorUserId
 * @property {'ACTIVE'|'INACTIVE'} status
 * @property {string} assignedAt
 * @property {AdvisorAssignmentHistory[]} history
 */

export {};
