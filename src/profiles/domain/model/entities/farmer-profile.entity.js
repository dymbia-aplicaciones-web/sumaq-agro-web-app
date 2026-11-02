/**
 * Contact and account preferences of an independent farmer.
 * Authentication credentials do not belong here. They are intentionally left
 * for IAM, which is outside the scope of the current delivery.
 *
 * @class FarmerProfile
 */
export class FarmerProfile {
    /**
     * @param {Object} props - Profile attributes.
     * @param {number} props.id - Profile identifier.
     * @param {number} props.userId - Farmer account.
     * @param {string} props.phoneNumber - Phone (at least 7 characters).
     * @param {string} props.email - Email address.
     * @param {string} [props.firstName=''] - First name.
     * @param {string} [props.lastName=''] - Last name.
     */
    constructor({ id, userId, phoneNumber, email, firstName, lastName }) {
        this.id = id;
        this.userId = userId;
        this.firstName = firstName?.trim() ?? '';
        this.lastName = lastName?.trim() ?? '';
        this.phoneNumber = FarmerProfile.validatePhoneNumber(phoneNumber);
        this.email = FarmerProfile.validateEmail(email);
    }

    /** @returns {string} First and last name. */
    get fullName() {
        return [this.firstName, this.lastName].filter(Boolean).join(' ');
    }

    /**
     * @param {string} firstName - First name.
     * @param {string} lastName - Last name.
     * @throws {Error} When a name is empty or longer than 100 characters.
     */
    updateName(firstName, lastName) {
        const first = firstName.trim();
        const last = lastName.trim();
        if (!first || !last || first.length > 100 || last.length > 100)
            throw new Error('First and last names are required and must not exceed 100 characters.');
        this.firstName = first;
        this.lastName = last;
    }

    /**
     * Updates the contact data that the farmer uses in the platform.
     * @param {string} phoneNumber - New phone.
     * @param {string} email - New email.
     * @throws {Error} When the data is invalid.
     */
    updateContact(phoneNumber, email) {
        this.phoneNumber = FarmerProfile.validatePhoneNumber(phoneNumber);
        this.email = FarmerProfile.validateEmail(email);
    }

    /** @param {string} value - Phone. @returns {string} Trimmed phone. */
    static validatePhoneNumber(value) {
        const phoneNumber = value.trim();
        if (phoneNumber.length < 7) throw new Error('The phone number must have at least seven characters.');
        return phoneNumber;
    }

    /** @param {string} value - Email. @returns {string} Normalized email. */
    static validateEmail(value) {
        const email = value.trim().toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('The email address is invalid.');
        return email;
    }
}
