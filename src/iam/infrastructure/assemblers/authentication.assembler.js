import {AuthenticatedUser} from '../../domain/model/entities/authenticated-user.entity.js';
import {UserRole} from '../../domain/model/user.entity.js';

export class AuthenticationAssembler {
    static signIn({email, password}) {
        return {email, password};
    }

    static signUp({email, password, role, firstName, lastName}) {
        if (!Object.values(UserRole).includes(role)) throw new Error('Invalid role');
        return {email, password, roles: [`ROLE_${role}`], profile: {firstName, lastName}};
    }

    static session(data) {
        const roles = data.roles.map(role => {
            const match = Object.values(UserRole).find(value => role === `ROLE_${value}`);
            if (!match) throw new Error('Unsupported IAM role');
            return match;
        });
        return new AuthenticatedUser({...data, roles});
    }
}
