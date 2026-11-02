/**
 * Institutional profile of a cooperative managed by a cooperative director.
 *
 * The cooperative is the aggregate root of the institutional information
 * managed by Profiles. Agricultural plots and campaigns remain in Field
 * Management and are only referenced by their identifiers in later features.
 *
 * @class Cooperative
 */
export class Cooperative {
    /**
     * @param {Object} props - Cooperative attributes.
     * @param {number} props.id
     * @param {number} props.directorUserId
     * @param {string} props.legalName
     * @param {string} props.region
     * @param {string} props.institutionalEmail
     * @param {string} props.legalRepresentative
     * @param {string} props.ruc
     * @param {string} props.headquartersAddress
     * @param {string} props.switchboardPhone
     */
    constructor({ id, directorUserId, legalName, region, institutionalEmail, legalRepresentative, ruc, headquartersAddress, switchboardPhone }) {
        this.id = id;
        this.directorUserId = directorUserId;
        this.legalName = legalName;
        this.region = region;
        this.institutionalEmail = institutionalEmail;
        this.legalRepresentative = legalRepresentative;
        this.ruc = ruc;
        this.headquartersAddress = headquartersAddress;
        this.switchboardPhone = switchboardPhone;
    }

    /**
     * Updates the legal and contact information managed by the director.
     * @param {import('../commands/update-cooperative.command.js').UpdateCooperativeCommand} data - New institutional data.
     * @throws {Error} When a value is missing or invalid.
     */
    updateInstitutionalData(data) {
        const values = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value).trim()]));
        if (Object.values(values).some(value => !value)) throw new Error('All institutional data is required.');
        if (!/^\d{11}$/.test(values.ruc)) throw new Error('The RUC must have eleven digits.');
        if (!/^\S+@\S+\.\S+$/.test(values.institutionalEmail)) throw new Error('The institutional email is invalid.');
        this.legalName = values.legalName;
        this.region = values.region;
        this.institutionalEmail = values.institutionalEmail.toLowerCase();
        this.legalRepresentative = values.legalRepresentative;
        this.ruc = values.ruc;
        this.headquartersAddress = values.headquartersAddress;
        this.switchboardPhone = values.switchboardPhone;
    }
}
