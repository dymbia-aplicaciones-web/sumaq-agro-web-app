import {BaseApi} from '../../shared/infrastructure/base-api.js';
import {AuthenticationAssembler} from './assemblers/authentication.assembler.js';

export class IamApi extends BaseApi {
    async signIn(command) {
        const {data} = await this.http.post('/authentication/sign-in', AuthenticationAssembler.signIn(command));
        return AuthenticationAssembler.session(data);
    }

    signUp(command) {
        return this.http.post('/authentication/sign-up', AuthenticationAssembler.signUp(command));
    }

    requestPasswordReset(email) {
        return this.http.post('/authentication/password-recovery', {email});
    }

    resetPassword(token, newPassword) {
        return this.http.post('/authentication/password-recovery/reset', {token, newPassword});
    }
}
