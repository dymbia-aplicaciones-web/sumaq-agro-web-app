import {CooperativeDashboard} from "../../domain/model/entities/cooperative-dashboard.entity.js";

/**
 * Maps the dashboard projection API contract to its read model.
 *
 * @class CooperativeDashboardAssembler
 */
export class CooperativeDashboardAssembler {
    /**
     * @param {Object} resource - Dashboard resource.
     * @returns {CooperativeDashboard} Dashboard read model.
     */
    static toEntity(resource) {
        return new CooperativeDashboard({ ...resource, id: Number(resource.id) });
    }
}
