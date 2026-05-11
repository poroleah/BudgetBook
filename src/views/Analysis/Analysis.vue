<script setup>
defineProps({
  budgetLeft: {
    type: Number,
    required: true,
  },
  categorySummary: {
    type: Array,
    required: true,
  },
  currency: {
    type: Object,
    required: true,
  },
  currentMonth: {
    type: String,
    required: true,
  },
  monthlyTrend: {
    type: Array,
    required: true,
  },
  trendMax: {
    type: Number,
    required: true,
  },
})
</script>

<template>
  <section class="screen analytics-screen">
    <article class="chart-panel">
      <div class="panel-heading">
        <p>{{ currentMonth }}</p>
        <h2>월별 수입/지출</h2>
      </div>
      <div class="trend-chart">
        <div v-for="item in monthlyTrend" :key="item.label" class="trend-month">
          <div class="bars">
            <span
              class="bar income-bar"
              :style="{ height: `${(item.income / trendMax) * 100}%` }"
            ></span>
            <span
              class="bar expense-bar"
              :style="{ height: `${(item.expense / trendMax) * 100}%` }"
            ></span>
          </div>
          <strong>{{ item.label }}</strong>
        </div>
      </div>
      <div class="legend">
        <span><i class="income-dot"></i>수입</span>
        <span><i class="expense-dot"></i>지출</span>
      </div>
    </article>

    <article class="chart-panel">
      <div class="panel-heading">
        <p>예산 남은 금액 {{ currency.format(budgetLeft) }}</p>
        <h2>카테고리 지출</h2>
      </div>
      <div class="category-list">
        <div v-for="item in categorySummary" :key="item.category" class="category-row">
          <div class="category-top">
            <span>{{ item.category }}</span>
            <strong>{{ currency.format(item.amount) }}</strong>
          </div>
          <div class="progress-track">
            <span :style="{ width: `${item.percent}%` }"></span>
          </div>
        </div>
        <p v-if="!categorySummary.length" class="empty-state">이번 달 지출이 없습니다.</p>
      </div>
    </article>
  </section>
</template>
