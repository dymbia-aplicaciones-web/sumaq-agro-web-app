/**
 * Updates personal and contact details without changing sign-in credentials.
 *
 * @class UpdateFarmerAccountCommand
 */
export class UpdateFarmerAccountCommand {
    /**
     * @param {Object} props - Command data.
     * @param {string} props.firstName - First name.
     * @param {string} props.lastName - Last name.
     * @param {string} props.phoneNumber - Contact phone.
     * @param {string} props.email - Contact email.
     */
    constructor({ firstName, lastName, phoneNumber, email }) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.email = email;
    }
}
