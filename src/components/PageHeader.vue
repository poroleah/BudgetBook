<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  backLabel: {
    type: String,
    default: '이전 페이지로 돌아가기',
  },
  close: {
    type: Boolean,
    default: false,
  },
  currency: {
    type: Object,
    default: null,
  },
  expense: {
    type: Number,
    default: null,
  },
  income: {
    type: Number,
    default: null,
  },
  transfer: {
    type: Number,
    default: null,
  },
})

defineEmits(['back'])

const hasSummary = computed(() =>
  props.currency &&
  [props.income, props.expense, props.transfer].every((value) => typeof value === 'number'),
)
</script>

<template>
  <div class="category-page-header">
    <button
      :class="close ? 'entry-action-button entry-cancel-button' : 'category-icon-button back-button'"
      type="button"
      :aria-label="backLabel"
      @click="$emit('back')"
    >
      <span aria-hidden="true"></span>
    </button>
    <div class="page-header-title">
      <h2>{{ title }}</h2>
      <div v-if="hasSummary" class="compact-summary page-header-summary" aria-label="이번 달 요약">
        <span>수입 {{ currency.format(income) }}</span>
        <span>지출 {{ currency.format(expense) }}</span>
        <span>이체 {{ currency.format(transfer) }}</span>
      </div>
    </div>
    <div class="category-header-actions">
      <slot name="right"></slot>
    </div>
  </div>
</template>
