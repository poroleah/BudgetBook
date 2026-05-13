<script setup>
defineProps({
  activeBookPage: {
    type: String,
    default: '',
  },
  activeTab: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
  },
  bookName: {
    type: String,
    default: '',
  },
  currency: {
    type: Object,
    required: true,
  },
  expense: {
    type: Number,
    required: true,
  },
  income: {
    type: Number,
    required: true,
  },
})

defineEmits(['open-category', 'open-settings'])
</script>

<template>
  <section class="topbar">
    <div class="title-area">
      <p class="eyebrow">Moneybook</p>
      <div class="title-row">
        <div class="title-copy">
          <div class="title-heading">
            <h1>{{ bookName || '내 가계부' }}</h1>
          </div>
          <div class="compact-summary" aria-label="이번 달 요약">
            <span>수입 {{ currency.format(income) }}</span>
            <span>지출 {{ currency.format(expense) }}</span>
            <span>잔액 {{ currency.format(balance) }}</span>
          </div>
        </div>
        <div v-if="activeTab === 'calendar'" class="book-menu">
          <button
            class="menu-button category-menu-button"
            type="button"
            aria-label="카테고리 페이지 열기"
            :aria-expanded="activeBookPage === 'category'"
            @click="$emit('open-category')"
          >
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </button>
          <button
            class="menu-button"
            type="button"
            aria-label="가계부 설정 열기"
            :aria-expanded="activeBookPage === 'settings'"
            @click="$emit('open-settings')"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
