<script setup>
import { computed } from 'vue'

const props = defineProps({
  categories: {
    type: Array,
    required: true,
  },
  currency: {
    type: Object,
    required: true,
  },
  transactions: {
    type: Array,
    required: true,
  },
})

defineEmits(['add-category'])

const categoryRows = computed(() =>
  props.categories.map((category) => {
    const items = props.transactions.filter((item) => item.category === category)
    const income = items
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + Number(item.amount), 0)
    const expense = items
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + Number(item.amount), 0)

    return {
      category,
      count: items.length,
      income,
      expense,
    }
  }),
)
</script>

<template>
  <section class="book-menu-panel category-page-panel">
    <div class="panel-heading">
      <p>Category</p>
      <h2>카테고리</h2>
    </div>

    <label>
      <span>카테고리 추가</span>
      <input type="text" placeholder="새 카테고리" @keyup.enter="$emit('add-category', $event)" />
    </label>

    <div class="category-page-list">
      <article v-for="row in categoryRows" :key="row.category" class="category-page-item">
        <div>
          <strong>{{ row.category }}</strong>
          <span>{{ row.count }}건</span>
        </div>
        <div class="category-page-money">
          <span v-if="row.income" class="income">+{{ currency.format(row.income) }}</span>
          <span v-if="row.expense" class="expense">-{{ currency.format(row.expense) }}</span>
          <span v-if="!row.income && !row.expense">기록 없음</span>
        </div>
      </article>
    </div>
  </section>
</template>
