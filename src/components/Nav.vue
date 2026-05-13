<script setup>
defineProps({
  tabs: {
    type: Array,
    required: true,
  },
  activeTab: {
    type: String,
    required: true,
  },
  activeTabIndex: {
    type: Number,
    required: true,
  },
})

defineEmits(['select-tab'])
</script>

<template>
  <nav
    class="bottom-tabs"
    aria-label="가계부 메뉴"
    :style="{ '--active-tab-index': activeTabIndex }"
  >
    <span class="bottom-tab-indicator"></span>
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      :class="{ active: activeTab === tab.id }"
      @click="$emit('select-tab', tab.id)"
    >
      {{ tab.label }}
    </button>
  </nav>
</template>
