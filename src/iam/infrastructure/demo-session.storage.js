import {User, UserRole} from "../domain/model/user.entity.js";

export const DEMO_USERS = [
    new User({ id: 1, displayName: 'Guillermo', experience: UserRole.FARMER, initialRoute: '/field-management/dashboard' }),
    new User({ id: 3, displayName: 'Cristian Santana', experience: UserRole.COOPERATIVE_DIRECTOR, initialRoute: '/profiles/cooperative/dashboard' }),
    new User({ id: 4, displayName: 'Ing. Juan A. Morales', experience: UserRole.AGRONOMIST, initialRoute: '/crop-health/inbox' })
];
