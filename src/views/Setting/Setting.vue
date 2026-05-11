<script setup>
defineProps({
  categories: {
    type: Array,
    required: true,
  },
  settings: {
    type: Object,
    required: true,
  },
})

defineEmits(['add-category'])
</script>

<template>
  <section class="screen settings-screen">
    <article class="settings-panel">
      <label>
        <span>가계부 이름</span>
        <input v-model.trim="settings.bookName" type="text" placeholder="내 가계부" />
      </label>
      <label>
        <span>월 예산</span>
        <input v-model.number="settings.monthlyBudget" type="number" min="0" />
      </label>
      <label>
        <span>테마</span>
        <select v-model="settings.theme">
          <option value="light">밝게</option>
          <option value="dark">어둡게</option>
        </select>
      </label>
      <label>
        <span>카테고리 추가</span>
        <input type="text" placeholder="새 카테고리" @keyup.enter="$emit('add-category', $event)" />
      </label>
      <div class="chip-list">
        <span v-for="category in categories" :key="category">{{ category }}</span>
      </div>
    </article>
  </section>
</template>
