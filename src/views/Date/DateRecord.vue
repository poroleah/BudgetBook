<script setup>
import { computed } from 'vue'

const props = defineProps({
  categoryDetails: {
    type: Object,
    required: true,
  },
  selectedDate: {
    type: String,
    required: true,
  },
  selectedTransactions: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['edit-transaction'])

const amountFormatter = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 })

const transactionAmount = (item) => {
  const amount = Number(item.amount)
  return Number.isFinite(amount) ? amount : 0
}

const amountLabel = (value) => amountFormatter.format(transactionAmount({ amount: value }))

const selectedIncome = computed(() =>
  props.selectedTransactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + transactionAmount(item), 0),
)

const selectedExpense = computed(() =>
  props.selectedTransactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + transactionAmount(item), 0),
)

function categoryIcon(category) {
  return props.categoryDetails[category]?.icon || category?.trim().slice(0, 1) || '?'
}

function editTransaction(transaction) {
  emit('edit-transaction', transaction)
}
</script>

<template>
  <section class="transaction-section">
    <div class="panel-heading transaction-heading">
      <div>
        <p>{{ selectedDate }}</p>
        <h2>거래 기록</h2>
      </div>
      <div class="daily-summary" aria-label="선택 날짜 수입, 지출">
        <div class="daily-summary-item">
          <span>수입</span>
          <strong class="income">+ ₩{{ amountLabel(selectedIncome) }}</strong>
        </div>
        <div class="daily-summary-item">
          <span>지출</span>
          <strong class="expense">− ₩{{ amountLabel(selectedExpense) }}</strong>
        </div>
      </div>
    </div>

    <div class="transaction-list">
      <article
        v-for="item in selectedTransactions"
        :key="item.id"
        class="transaction-item"
        role="button"
        tabindex="0"
        @click="editTransaction(item)"
        @keydown.enter.prevent="editTransaction(item)"
        @keydown.space.prevent="editTransaction(item)"
      >
        <div class="transaction-main">
          <span class="transaction-category-icon" aria-hidden="true">{{ categoryIcon(item.category) }}</span>
          <div>
            <strong>{{ item.subcategory || item.title }}</strong>
            <span>{{ [item.assetName, item.paymentMethod, item.memo].filter(Boolean).join(' | ') || '-' }}</span>
          </div>
        </div>
        <div class="amount-line">
          <b :class="item.type">
            {{ item.type === 'income' ? '+ ₩' : '− ₩' }}{{ amountLabel(item.amount) }}
          </b>
          <button type="button" @click.stop="editTransaction(item)">수정</button>
        </div>
      </article>
      <p v-if="!selectedTransactions.length" class="empty-state">기록이 없습니다.</p>
    </div>
  </section>
</template>
