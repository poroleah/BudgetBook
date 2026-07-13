<script setup>
import { computed, ref, toRef } from 'vue'
import { useAnalysis } from '../../composables/useAnalysis'

const props = defineProps({
  budgetLeft: { type: Number, required: true },
  currency: { type: Object, required: true },
  currentMonth: { type: String, required: true },
  monthExpense: { type: Number, required: true },
  monthTransactions: { type: Array, required: true },
  state: { type: Object, required: true },
})

const { categorySummary, monthlyTrend, trendMax } = useAnalysis(
  props.state,
  toRef(props, 'currentMonth'),
  toRef(props, 'monthTransactions'),
  toRef(props, 'monthExpense'),
)

const analysisView = ref('trend')
const pad = (value) => String(value).padStart(2, '0')
const today = new Date()
const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
const todayMonth = todayKey.slice(0, 7)

const visibleExpenseGroups = computed(() => {
  const expenses = props.monthTransactions
    .filter((item) => item.type === 'expense' && item.date <= todayKey)
    .sort((a, b) => a.date.localeCompare(b.date) || Number(a.createdAt || a.id) - Number(b.createdAt || b.id))

  return expenses.reduce((groups, item) => {
    let group = groups.at(-1)
    if (!group || group.date !== item.date) {
      group = { date: item.date, total: 0, items: [] }
      groups.push(group)
    }
    group.total += Number(item.amount) || 0
    group.items.push(item)
    return groups
  }, [])
})

const expenseRangeLabel = computed(() => {
  if (props.currentMonth === todayMonth) return `1일~${today.getDate()}일`
  if (props.currentMonth < todayMonth) {
    const [year, month] = props.currentMonth.split('-').map(Number)
    return `1일~${new Date(year, month, 0).getDate()}일`
  }
  return '예정 내역'
})

function categoryIcon(category) {
  return props.state.settings.categoryDetails?.[category]?.icon || category?.trim().slice(0, 1) || '?'
}

function expenseTitle(item) {
  return item.subcategory || item.title || item.category || '지출'
}
</script>

<template>
  <section class="screen analytics-screen">
    <article class="chart-panel">
      <div class="panel-heading analysis-heading">
        <div>
          <p>{{ currentMonth }}</p>
          <h2>{{ analysisView === 'trend' ? '월별 수입/지출' : '월별 카테고리 지출' }}</h2>
        </div>
        <button
          class="analysis-view-button"
          type="button"
          :aria-pressed="analysisView === 'category'"
          @click="analysisView = analysisView === 'trend' ? 'category' : 'trend'"
        >
          {{ analysisView === 'trend' ? '카테고리별 지출' : '월별 추이' }}
        </button>
      </div>

      <template v-if="analysisView === 'trend'">
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
      </template>

      <div v-else class="category-list analysis-category-list">
        <div v-for="item in categorySummary" :key="item.category" class="category-row">
          <div class="category-top">
            <span class="category-summary-name">
              <i aria-hidden="true">{{ categoryIcon(item.category) }}</i>
              {{ item.category }}
            </span>
            <strong>{{ currency.format(item.amount) }}</strong>
          </div>
          <div class="progress-track category-progress">
            <span :style="{ width: `${item.percent}%` }"></span>
          </div>
          <small>전체 지출의 {{ item.percent }}%</small>
        </div>
        <p v-if="!categorySummary.length" class="empty-state">이번 달 지출이 없습니다.</p>
      </div>
    </article>

    <article class="chart-panel expense-stack-panel">
      <div class="panel-heading">
        <p>{{ currentMonth }} · {{ expenseRangeLabel }}</p>
        <h2>월 지출 목록</h2>
      </div>

      <div class="expense-day-stack">
        <section v-for="group in visibleExpenseGroups" :key="group.date" class="expense-day-group">
          <header>
            <div>
              <strong>{{ Number(group.date.slice(8, 10)) }}일</strong>
              <span>{{ group.items.length }}건</span>
            </div>
            <b>− {{ currency.format(group.total) }}</b>
          </header>
          <div class="expense-items">
            <article v-for="item in group.items" :key="item.id" class="expense-stack-item">
              <span class="expense-category-icon" aria-hidden="true">{{ categoryIcon(item.category) }}</span>
              <div class="expense-copy">
                <strong>{{ expenseTitle(item) }}</strong>
                <span>{{ [item.category, item.paymentMethod, item.assetName].filter(Boolean).join(' · ') }}</span>
              </div>
              <b>− {{ currency.format(Number(item.amount) || 0) }}</b>
            </article>
          </div>
        </section>
        <p v-if="!visibleExpenseGroups.length" class="empty-state">표시할 지출 내역이 없습니다.</p>
      </div>
    </article>
  </section>
</template>

<style scoped>
.analysis-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.analysis-view-button {
  flex: 0 0 auto;
  min-height: 34px;
  border: 1px solid #dfe5ec;
  border-radius: 999px;
  background: #fff;
  padding: 0 13px;
  color: #20c997;
  font: inherit;
  font-weight: 500;
}

.analysis-category-list {
  display: grid;
  gap: 18px;
  min-height: 280px;
  align-content: start;
  padding-top: 24px;
}

.analysis-category-list small {
  color: #7a8696;
  font-size: 0.75rem;
}

.category-summary-name {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.category-summary-name i,
.expense-category-icon {
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  place-items: center;
  border-radius: 50%;
  background: #fbdce2;
  color: #f43f5e;
  font-style: normal;
  font-weight: 500;
}

.category-progress span { background: #f43f5e; }

.expense-stack-panel { min-width: 0; }

.expense-day-stack {
  display: grid;
  gap: 14px;
  margin-top: 18px;
}

.expense-day-group {
  overflow: hidden;
  border: 1px solid #ebf0f5;
  border-radius: 12px;
  background: #fff;
}

.expense-day-group > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
  padding: 0 12px;
  background: #f8f9fa;
}

.expense-day-group > header div {
  display: flex;
  align-items: baseline;
  gap: 7px;
}

.expense-day-group > header span {
  color: #7a8696;
  font-size: 0.75rem;
}

.expense-day-group > header b,
.expense-stack-item > b {
  color: #f43f5e;
  white-space: nowrap;
}

.expense-items { display: grid; }

.expense-stack-item {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
  min-height: 56px;
  border-bottom: 1px solid #ebf0f5;
  padding: 7px 12px;
}

.expense-stack-item:last-child { border-bottom: 0; }

.expense-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.expense-copy strong,
.expense-copy span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.expense-copy span {
  color: #7a8696;
  font-size: 0.75rem;
}

@media (max-width: 520px) {
  .analysis-heading { align-items: center; }
  .analysis-view-button { padding-inline: 10px; font-size: 0.78rem; }
  .expense-stack-item > b { font-size: 0.8rem; }
}
</style>
