/**
 * Side menu of each experience (Angular `navigation-config.ts`).
 * `title` and `label` are i18n keys; Material Symbols were replaced by PrimeIcons.
 */

/** Navigation for an independent farmer. */
export const farmerNavigationSections = [
    {
        title: 'section.major',
        options: [{ link: '/field-management/dashboard', label: 'option.my-plot', icon: 'pi pi-home' }]
    },
    {
        title: 'section.agricultural-operation',
        options: [
            { link: '/crop-health/monitoring', label: 'option.crop-health', icon: 'pi pi-sun' },
            { link: '/field-management/finances', label: 'option.expenses', icon: 'pi pi-wallet' },
            { link: '/crop-health/advisor', label: 'option.advisor', icon: 'pi pi-comments' },
            { link: '/harvest-certification/certificates', label: 'option.harvest-certificates', icon: 'pi pi-verified' }
        ]
    },
    {
        title: 'section.system',
        options: [
            { link: '/crop-health/alerts', label: 'option.alerts', icon: 'pi pi-bell' },
            { link: '/subscriptions/billing', label: 'subscriptions.nav-title', icon: 'pi pi-credit-card' },
            { link: '/profiles/settings', label: 'option.settings', icon: 'pi pi-cog' }
        ]
    }
];

/** Navigation for the director who manages a cooperative. */
export const cooperativeDirectorNavigationSections = [
    {
        title: 'section.institutional-management',
        options: [
            { link: '/profiles/cooperative/dashboard', label: 'option.cooperative-dashboard', icon: 'pi pi-home' },
            // Not implemented in Angular either: it opens the page not found.
            { link: '/profiles/cooperative/members', label: 'option.member-directory', icon: 'pi pi-users' },
            { link: '/crop-health/monitoring', label: 'option.cooperative-plot-health', icon: 'pi pi-file' },
            { link: '/field-management/finances', label: 'option.cooperative-costs', icon: 'pi pi-calendar' },
            { link: '/harvest-certification/certificates', label: 'option.cooperative-certificates', icon: 'pi pi-calendar' },
            { link: '/crop-health/alerts', label: 'option.cooperative-alerts', icon: 'pi pi-calendar' },
            { link: '/crop-health/inbox', label: 'option.diagnosis-inbox', icon: 'pi pi-inbox' }
        ]
    },
    {
        title: 'section.system',
        options: [
            { link: '/subscriptions/billing', label: 'subscriptions.nav-title', icon: 'pi pi-credit-card' },
            { link: '/profiles/cooperative/settings', label: 'option.cooperative-settings', icon: 'pi pi-cog' }
        ]
    }
];

/** Navigation for the agronomist. */
export const agronomistNavigationSections = [
    {
        title: 'section.agricultural-operation',
        options: [
            { link: '/crop-health/inbox', label: 'option.diagnosis-inbox', icon: 'pi pi-inbox' },
            { link: '/crop-health/inspections', label: 'option.field-inspections', icon: 'pi pi-map-marker' },
            { link: '/crop-health/prescriptions', label: 'option.prescriptions', icon: 'pi pi-file-edit' },
            { link: '/crop-health/monitoring', label: 'option.crop-health', icon: 'pi pi-sun' },
            { link: '/crop-health/alerts', label: 'option.alerts', icon: 'pi pi-exclamation-triangle' }
        ]
    },
    {
        title: 'section.system',
        options: [{ link: '/subscriptions/billing', label: 'subscriptions.nav-title', icon: 'pi pi-credit-card' }]
    }
];

/**
 * Returns only the navigation options supported by the selected demo role.
 * @param {string} experience - Role of the user.
 * @returns {Array<Object>} Sections of the side menu.
 */
export function navigationFor(experience) {
    if (experience === 'AGRONOMIST') return agronomistNavigationSections;
    return experience === 'COOPERATIVE_DIRECTOR' ? cooperativeDirectorNavigationSections : farmerNavigationSections;
}
