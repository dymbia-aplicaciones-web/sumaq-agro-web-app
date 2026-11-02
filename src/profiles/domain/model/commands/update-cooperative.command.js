/**
 * Data submitted to update the institutional profile of a cooperative.
 *
 * @class UpdateCooperativeCommand
 */
export class UpdateCooperativeCommand {
    /**
     * @param {Object} data - Institutional data.
     * @param {string} data.legalName - Legal name.
     * @param {string} data.region - Productive region.
     * @param {string} data.institutionalEmail - Contact email.
     * @param {string} data.legalRepresentative - Legal representative or general manager.
     * @param {string} data.ruc - Tax identifier (11 digits).
     * @param {string} data.headquartersAddress - Address of the headquarters.
     * @param {string} data.switchboardPhone - Switchboard phone.
     */
    constructor({ legalName, region, institutionalEmail, legalRepresentative, ruc, headquartersAddress, switchboardPhone }) {
        this.legalName = legalName;
        this.region = region;
        this.institutionalEmail = institutionalEmail;
        this.legalRepresentative = legalRepresentative;
        this.ruc = ruc;
        this.headquartersAddress = headquartersAddress;
        this.switchboardPhone = switchboardPhone;
    }
}
