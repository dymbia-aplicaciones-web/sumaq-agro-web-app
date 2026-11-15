export const mockAuthentication = import.meta.env.DEV &&
    false;

export const developmentAccounts = mockAuthentication ? [
    {id: 1, email: 'farmer@sumaqagro.test', role: 'FARMER', fullName: 'Guillermo'},
    {id: 3, email: 'cooperative@sumaqagro.test', role: 'COOPERATIVE_DIRECTOR', fullName: 'Cristian Santana'},
    {id: 4, email: 'agronomist@sumaqagro.test', role: 'AGRONOMIST', fullName: 'Ing. Juan A. Morales'}
] : [];

const password = 'SumaqAgroDemo2026!';
const accounts = new Map(developmentAccounts.map(({id, email, role, fullName}) => [email, {
    user: {id, email, roles: [`ROLE_${role}`], fullName}, password
}]));
let nextId = Date.now();

function reject(status) {
    throw Object.assign(new Error('Development authentication request rejected'), {response: {status}});
}

export function developmentSignIn(body) {
    const account = accounts.get(body.email.trim().toLowerCase());
    if (!account || account.password !== body.password) reject(401);
    return {...account.user, token: `mock-session-${crypto.randomUUID()}`};
}

export function developmentSignUp(body) {
    const email = body.email.trim().toLowerCase();
    const {firstName, lastName} = body.profile;
    if (!email || body.password.length < 8 || !firstName.trim() || !lastName.trim() ||
        firstName.length > 100 || lastName.length > 100) reject(400);
    if (accounts.has(email)) reject(409);
    const user = {id: nextId++, email, roles: body.roles, fullName: `${firstName} ${lastName}`};
    accounts.set(email, {user, password: body.password});
    return {id: user.id, email, roles: user.roles};
}
