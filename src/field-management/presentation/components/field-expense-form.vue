<script setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {Money} from "../../../shared/domain/model/money.js";
import {ExpenseCategory} from "../../domain/model/entities/expense-entry.entity.js";

/** Labor activities offered in the select (`field-management.labor-activity.*`). */
const LABOR_ACTIVITIES = ['SOWING', 'WEEDING', 'HILLING', 'SPRAYING', 'HARVEST'];

/**
 * Form of one expense type (Angular `FieldExpenseForm`): inputs (US-37),
 * labor (US-38) or freight (US-39). It shows the live total.
 */
const props = defineProps({
  category: { type: String, required: true },
  saving: { type: Boolean, default: false }
});
const emit = defineEmits(['submitted', 'cancel']);
const { t } = useI18n();

const REQUIRED = 'field-management.expense-form.required';
const POSITIVE = 'field-management.expense-form.positive';

const form = ref({
  inputName: '', quantity: null, unitPrice: null,
  activity: '', workers: null, days: null, dailyWage: null,
  route: '', cost: null,
  expenseDate: new Date()
});
const submitted = ref(false);

const activities = computed(() => LABOR_ACTIVITIES.map(key => ({ label: t(`field-management.labor-activity.${key}`) })));

/** Validation errors of the fields of the current category (i18n keys). */
const errors = computed(() => {
  const value = form.value;
  const result = {};
  const positive = (field, minimum) => { if (value[field] === null || value[field] < minimum) result[field] = POSITIVE; };
  const text = (field, max) => { if (!value[field].trim() || value[field].length > max) result[field] = REQUIRED; };
  if (props.category === ExpenseCategory.INPUTS) {
    text('inputName', 60); positive('quantity', 0.01); positive('unitPrice', 0.01);
  } else if (props.category === ExpenseCategory.LABOR) {
    text('activity', 60); positive('workers', 1); positive('days', 0.5); positive('dailyWage', 0.01);
  } else {
    text('route', 80); positive('cost', 0.01);
  }
  if (!value.expenseDate) result.expenseDate = REQUIRED;
  return result;
});

const total = computed(() => {
  const value = form.value;
  switch (props.category) {
    case ExpenseCategory.INPUTS: return new Money(Math.max((value.quantity ?? 0) * (value.unitPrice ?? 0), 0));
    case ExpenseCategory.LABOR: return new Money(Math.max((value.workers ?? 0) * (value.days ?? 0) * (value.dailyWage ?? 0), 0));
    default: return new Money(Math.max(value.cost ?? 0, 0));
  }
});

/**
 * @param {string} field - Field name.
 * @returns {string|undefined} Translated error after the first submit.
 */
const errorOf = (field) => submitted.value && errors.value[field] ? t(errors.value[field]) : undefined;

/** Emits the expense data when the form is valid. */
const onSubmit = () => {
  submitted.value = true;
  if (Object.keys(errors.value).length) return;
  const value = form.value;
  const base = { category: props.category, expenseDate: value.expenseDate };
  if (props.category === ExpenseCategory.INPUTS) emit('submitted', { ...base, inputName: value.inputName, quantity: value.quantity, unitPrice: value.unitPrice });
  else if (props.category === ExpenseCategory.LABOR) emit('submitted', { ...base, activity: value.activity, workers: value.workers, days: value.days, dailyWage: value.dailyWage });
  else emit('submitted', { ...base, route: value.route, cost: value.cost });
};
</script>

<template>
  <form id="expense-form" class="form-grid" novalidate @submit.prevent="onSubmit">
    <!-- Inputs: product, quantity and unit price (US-37) -->
    <template v-if="category === 'INPUTS'">
      <div class="sa-field full">
        <label for="input-name">{{ t('field-management.expense-form.input-name') }}</label>
        <pv-input-text id="input-name" v-model="form.inputName" :placeholder="t('field-management.expense-form.input-name-placeholder')" :invalid="!!errorOf('inputName')" fluid/>
        <small v-if="errorOf('inputName')" class="sa-error">{{ errorOf('inputName') }}</small>
      </div>
      <div class="sa-field">
        <label for="quantity">{{ t('field-management.expense-form.quantity') }}</label>
        <pv-input-number v-model="form.quantity" input-id="quantity" :min="0" :max-fraction-digits="2" :invalid="!!errorOf('quantity')" fluid/>
        <small v-if="errorOf('quantity')" class="sa-error">{{ errorOf('quantity') }}</small>
      </div>
      <div class="sa-field">
        <label for="unit-price">{{ t('field-management.expense-form.unit-price') }}</label>
        <pv-input-number v-model="form.unitPrice" input-id="unit-price" mode="currency" currency="PEN" locale="es-PE" :min="0" :invalid="!!errorOf('unitPrice')" fluid/>
        <small v-if="errorOf('unitPrice')" class="sa-error">{{ errorOf('unitPrice') }}</small>
      </div>
    </template>

    <!-- Labor: task, workers, days and daily wage (US-38) -->
    <template v-else-if="category === 'LABOR'">
      <div class="sa-field full">
        <label for="activity">{{ t('field-management.expense-form.activity') }}</label>
        <pv-select v-model="form.activity" input-id="activity" :options="activities" option-label="label" option-value="label" :invalid="!!errorOf('activity')" fluid/>
        <small v-if="errorOf('activity')" class="sa-error">{{ errorOf('activity') }}</small>
      </div>
      <div class="sa-field">
        <label for="workers">{{ t('field-management.expense-form.workers') }}</label>
        <pv-input-number v-model="form.workers" input-id="workers" :min="0" :invalid="!!errorOf('workers')" fluid/>
        <small v-if="errorOf('workers')" class="sa-error">{{ errorOf('workers') }}</small>
      </div>
      <div class="sa-field">
        <label for="days">{{ t('field-management.expense-form.days') }}</label>
        <pv-input-number v-model="form.days" input-id="days" :min="0" :step="0.5" :max-fraction-digits="1" :invalid="!!errorOf('days')" fluid/>
        <small v-if="errorOf('days')" class="sa-error">{{ errorOf('days') }}</small>
      </div>
      <div class="sa-field">
        <label for="daily-wage">{{ t('field-management.expense-form.daily-wage') }}</label>
        <pv-input-number v-model="form.dailyWage" input-id="daily-wage" mode="currency" currency="PEN" locale="es-PE" :min="0" :invalid="!!errorOf('dailyWage')" fluid/>
        <small v-if="errorOf('dailyWage')" class="sa-error">{{ errorOf('dailyWage') }}</small>
      </div>
    </template>

    <!-- Freight: route and cost (US-39) -->
    <template v-else>
      <div class="sa-field full">
        <label for="route">{{ t('field-management.expense-form.route') }}</label>
        <pv-input-text id="route" v-model="form.route" :placeholder="t('field-management.expense-form.route-placeholder')" :invalid="!!errorOf('route')" fluid/>
        <small v-if="errorOf('route')" class="sa-error">{{ errorOf('route') }}</small>
      </div>
      <div class="sa-field">
        <label for="cost">{{ t('field-management.expense-form.cost') }}</label>
        <pv-input-number v-model="form.cost" input-id="cost" mode="currency" currency="PEN" locale="es-PE" :min="0" :invalid="!!errorOf('cost')" fluid/>
        <small v-if="errorOf('cost')" class="sa-error">{{ errorOf('cost') }}</small>
      </div>
    </template>

    <div class="sa-field">
      <label for="expense-date">{{ t('field-management.expense-form.date') }}</label>
      <pv-date-picker v-model="form.expenseDate" input-id="expense-date" date-format="dd/mm/yy" show-icon :invalid="!!errorOf('expenseDate')" fluid/>
      <small v-if="errorOf('expenseDate')" class="sa-error">{{ errorOf('expenseDate') }}</small>
    </div>
  </form>

  <div class="total" aria-live="polite">
    <span>{{ t('field-management.expense-form.total') }}</span>
    <strong>{{ total.format() }}</strong>
  </div>

  <div class="flex justify-content-between mt-3">
    <pv-button type="button" outlined class="sa-pill" :label="t('field-management.expense-form.cancel')" @click="emit('cancel')"/>
    <pv-button type="submit" form="expense-form" class="sa-pill" icon="pi pi-save" :label="t('field-management.expense-form.save')" :disabled="saving"/>
  </div>
</template>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 24px;
}

.full {
  grid-column: 1 / -1;
}

.total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--sa-secondary-container);
  color: var(--sa-on-secondary-container);
}

.total strong {
  font-size: 22px;
}

@media (max-width: 599.98px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
