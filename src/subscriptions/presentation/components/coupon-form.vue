<script setup>
import {ref} from "vue";
import {useI18n} from "vue-i18n";

/** Validates a promotional code and emits it to the checkout view (Angular `CouponForm`). */
const props = defineProps({
  /** Prevents applying a code while checkout is processing. */
  disabled: { type: Boolean, default: false }
});
/** `apply`: the user wants to validate this promotional code. */
const emit = defineEmits(['apply']);
const { t } = useI18n();

const couponCode = ref('');
const touched = ref(false);

const onSubmit = () => {
  touched.value = true;
  if (!couponCode.value.trim() || props.disabled) return;
  emit('apply', couponCode.value.trim());
};
</script>

<template>
  <form class="coupon-form" novalidate @submit.prevent="onSubmit">
    <div class="sa-field flex-1">
      <label for="coupon-code">{{ t('subscriptions.checkout.coupon-label') }}</label>
      <pv-input-text id="coupon-code" v-model="couponCode" autocomplete="off" :invalid="touched && !couponCode.trim()" fluid/>
      <small v-if="touched && !couponCode.trim()" class="sa-error">{{ t('subscriptions.checkout.coupon-required') }}</small>
    </div>
    <pv-button type="submit" outlined class="apply" :label="t('subscriptions.checkout.apply-coupon')" :disabled="disabled"/>
  </form>
</template>

<style scoped>
.coupon-form {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.apply.p-button {
  margin-top: 27px;
}

@media (max-width: 520px) {
  .coupon-form {
    flex-direction: column;
    align-items: stretch;
  }

  .apply.p-button {
    margin-top: 0;
  }
}
</style>
