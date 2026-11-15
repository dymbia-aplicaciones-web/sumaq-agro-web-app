const authForm = () => import('./views/auth-form.vue');

export default [
    {path: '/sign-in', name: 'iam-sign-in', component: authForm, props: {mode: 'signIn'}, meta: {public: true, title: 'iam.signIn.title'}},
    {path: '/sign-up', name: 'iam-sign-up', component: authForm, props: {mode: 'signUp'}, meta: {public: true, title: 'iam.signUp.title'}},
    {path: '/forgot-password', name: 'iam-forgot-password', component: authForm, props: {mode: 'forgot'}, meta: {public: true, title: 'iam.recovery.forgot.title'}},
    {path: '/reset-password', name: 'iam-reset-password', component: authForm, props: {mode: 'reset'}, meta: {public: true, title: 'iam.recovery.reset.title'}}
];
