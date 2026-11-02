/**
 * Updates the farmer's contact information.
 *
 * @class UpdateFarmerContactCommand
 */
export class UpdateFarmerContactCommand {
    /**
     * @param {Object} props - Command data.
     * @param {string} props.phoneNumber - Contact phone.
     * @param {string} props.email - Contact email.
     */
    constructor({ phoneNumber, email }) {
        this.phoneNumber = phoneNumber;
        this.email = email;
    }
}
