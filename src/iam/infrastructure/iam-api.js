import {developmentSignIn, developmentSignUp, mockAuthentication} from './mock/development-authentication.js';
import {BaseApi} from '../../shared/infrastructure/base-api.js';
import {AuthenticationAssembler} from './assemblers/authentication.assembler.js';

export class IamApi extends BaseApi {
    async signIn(command) {
        const payload = AuthenticationAssembler.signIn(command);
        const data = mockAuthentication ? developmentSignIn(payload)
            : (await this.http.post('/authentication/sign-in', payload)).data;
        return AuthenticationAssembler.session(data);
    }

    async signUp(command) {
        const payload = AuthenticationAssembler.signUp(command);
        if (mockAuthentication) return developmentSignUp(payload);
        return this.http.post('/authentication/sign-up', payload);
    }

    async requestPasswordReset(email) {
        if (mockAuthentication) return;
        return this.http.post('/authentication/password-recovery', {email});
    }

    async resetPassword(token, newPassword) {
        if (mockAuthentication) return;
        return this.http.post('/authentication/password-recovery/reset', {token, newPassword});
    }
}
