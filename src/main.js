import { createApp } from 'vue'
import 'leaflet/dist/leaflet.css';
import './style.css'
import App from './app.vue'
import i18n from "./i18n.js";
import PrimeVue from 'primevue/config';
import SumaqAgroPreset from "./shared/presentation/theme/sumaqagro-preset.js";
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import Tooltip from 'primevue/tooltip';
import {
    AutoComplete,
    Button,
    Card,
    Checkbox,
    Column,
    ConfirmationService,
    ConfirmDialog,
    DataTable,
    DatePicker,
    Dialog,
    DialogService,
    Divider,
    Drawer,
    IconField,
    InputGroup,
    InputGroupAddon,
    InputIcon,
    InputNumber,
    InputText,
    Menu,
    Message,
    ProgressBar,
    RadioButton,
    Select,
    SelectButton,
    Slider,
    Tag,
    Textarea,
    Toast,
    ToastService,
    Toolbar
} from "primevue";
import router from "./router.js";
import pinia from "./pinia.js";

const primeUiLicenseKey = import.meta.env.VITE_PRIME_UI_LICENSE_KEY;

// noinspection JSCheckFunctionSignatures
createApp(App)
    .use(i18n)
    .use(PrimeVue, {theme: { preset: SumaqAgroPreset, options: { darkModeSelector: '.app-dark' }}, ripple: true, license: primeUiLicenseKey || undefined})
    .use(ConfirmationService)
    .use(DialogService)
    .use(ToastService)
    .component('pv-auto-complete',      AutoComplete)
    .component('pv-button',             Button)
    .component('pv-card',               Card)
    .component('pv-checkbox',           Checkbox)
    .component('pv-column',             Column)
    .component('pv-confirm-dialog',     ConfirmDialog)
    .component('pv-data-table',         DataTable)
    .component('pv-date-picker',        DatePicker)
    .component('pv-dialog',             Dialog)
    .component('pv-divider',            Divider)
    .component('pv-drawer',             Drawer)
    .component('pv-icon-field',         IconField)
    .component('pv-input-group',        InputGroup)
    .component('pv-input-group-addon',  InputGroupAddon)
    .component('pv-input-icon',         InputIcon)
    .component('pv-input-number',       InputNumber)
    .component('pv-input-text',         InputText)
    .component('pv-menu',               Menu)
    .component('pv-message',            Message)
    .component('pv-progress-bar',       ProgressBar)
    .component('pv-radio-button',       RadioButton)
    .component('pv-select',             Select)
    .component('pv-select-button',      SelectButton)
    .component('pv-slider',             Slider)
    .component('pv-tag',                Tag)
    .component('pv-textarea',           Textarea)
    .component('pv-toast',              Toast)
    .component('pv-toolbar',            Toolbar)
    .directive('tooltip',               Tooltip)
    .use(router)
    .use(pinia)
    .mount('#app')
