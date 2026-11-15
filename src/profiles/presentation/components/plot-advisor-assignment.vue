<script setup>
import {computed, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';

const props = defineProps({
    team: { type: Array, required: true },
    assignment: { type: Object, default: null },
    busy: { type: Boolean, default: false }
});
const emit = defineEmits(['change']);
const {t} = useI18n();
const key = 'profiles.cooperative.supervision';
const active = computed(() => props.assignment?.status === 'ACTIVE');
const responsible = computed(() => props.team.find(advisor => advisor.userId === props.assignment?.advisorUserId));
const selected = ref(null);

watch(() => props.assignment, assignment => {
    selected.value = assignment?.status === 'ACTIVE' ? assignment.advisorUserId : null;
}, { immediate: true });
</script>

<template>
  <div class="my-2">
    <p v-if="active">{{ t(key + '.in-charge') }} <strong>{{ responsible?.name ?? assignment.advisorUserId }}</strong></p>
    <p v-else>{{ t(key + '.none') }}</p>
    <div class="flex flex-wrap gap-2">
      <pv-select v-if="team.length" v-model="selected" :options="team" option-label="name" option-value="userId"
                 :disabled="busy" :placeholder="t('profiles.advisory.select')"
                 :aria-label="t('profiles.advisory.select')"/>
      <small v-else>{{ t(key + '.no-team') }}</small>
      <pv-button v-if="team.length" :disabled="busy || selected === null" :label="t(key + '.assign')"
                 @click="emit('change', selected)"/>
      <pv-button v-if="active" outlined :disabled="busy" :label="t(key + '.release')"
                 @click="emit('change', null)"/>
    </div>
  </div>
</template>
