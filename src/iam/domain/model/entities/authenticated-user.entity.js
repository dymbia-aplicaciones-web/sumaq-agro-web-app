import {UserRole} from '../user.entity.js';

const routes = {
    [UserRole.FARMER]: '/field-management/dashboard',
    [UserRole.COOPERATIVE_DIRECTOR]: '/profiles/cooperative/dashboard',
    [UserRole.AGRONOMIST]: '/crop-health/inbox'
};

export class AuthenticatedUser {
    constructor({id, email, fullName, roles, token}) {
        const experience = [UserRole.COOPERATIVE_DIRECTOR, UserRole.AGRONOMIST, UserRole.FARMER].find(role => roles.includes(role));
        if (!experience || !Number.isSafeInteger(Number(id)) || Number(id) <= 0 ||
            typeof token !== 'string' || !token.trim()) throw new Error('Invalid authentication response');
        Object.assign(this, {id: Number(id), email, fullName, roles, token, experience,
            displayName: fullName?.trim() || email, initialRoute: routes[experience]});
    }

    hasRole(...roles) {
        return roles.some(role => this.roles.includes(role));
    }
}
