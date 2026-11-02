import {Money} from "../../../shared/domain/model/money.js";
import {resourcesFromResponse} from "../../../shared/infrastructure/base-assembler.js";
import {Payment} from "../../domain/model/entities/payment.entity.js";

/**
 * Maps payment entities to and from API resources.
 *
 * @class PaymentAssembler
 */
export class PaymentAssembler {
    /**
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - The API response containing payments.
     * @returns {Payment[]} Payment entities.
     */
    static toEntitiesFromResponse(response) {
        return resourcesFromResponse(response, 'payments').map(resource => this.toEntityFromResource(resource));
    }

    /**
     * @param {Object} resource - Payment resource (`paidAt` in ISO 8601).
     * @returns {Payment} Payment entity.
     */
    static toEntityFromResource(resource) {
        return new Payment({
            id: Number(resource.id),
            subscriptionId: resource.subscriptionId,
            amount: new Money(resource.amount, resource.currency),
            transactionToken: resource.transactionToken,
            status: resource.status,
            paidAt: new Date(resource.paidAt)
        });
    }

    /**
     * @param {Payment} entity - Payment entity.
     * @returns {Object} Payment resource.
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id,
            subscriptionId: entity.subscriptionId,
            amount: entity.amount.amount,
            currency: entity.amount.currency,
            transactionToken: entity.transactionToken,
            status: entity.status,
            paidAt: entity.paidAt.toISOString()
        };
    }
}
