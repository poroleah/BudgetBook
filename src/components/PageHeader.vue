<script setup>
defineProps({
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
})

defineEmits(['back'])
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
    <h2>{{ title }}</h2>
    <div class="category-header-actions">
      <slot name="right"></slot>
    </div>
  </div>
</template>
