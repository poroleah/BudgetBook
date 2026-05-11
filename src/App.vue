<script setup>
import { computed, reactive, ref, watch } from 'vue'
import AnalysisView from './views/Analysis/Analysis.vue'
import AssetView from './views/Asset/Asset.vue'
import DateView from './views/Date/Date.vue'
import SettingView from './views/Setting/Setting.vue'

const today = new Date()
const pad = (value) => String(value).padStart(2, '0')
const toDateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const currency = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
})

const initialState = {
  transactions: [
    {
      id: 1,
      date: toDateKey(today),
      type: 'expense',
      category: '식비',
      title: '점심',
      amount: 12000,
    },
    {
      id: 2,
      date: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-05`,
      type: 'income',
      category: '월급',
      title: '급여',
      amount: 2800000,
    },
    {
      id: 3,
      date: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-09`,
      type: 'expense',
      category: '교통',
      title: '교통카드 충전',
      amount: 50000,
    },
  ],
  assets: [
    { id: 1, name: '생활비 통장', type: '은행', balance: 1450000 },
    { id: 2, name: '비상금', type: '저축', balance: 700000 },
    { id: 3, name: '이번 달 카드값', type: '카드', balance: -320000 },
  ],
  settings: {
    bookName: '내 가계부',
    monthlyBudget: 1200000,
    theme: 'light',
    categories: ['식비', '교통', '주거', '쇼핑', '월급', '기타'],
  },
}

const savedState = localStorage.getItem('moneybook-state')
const savedStateData = savedState ? JSON.parse(savedState) : {}
const state = reactive({
  ...initialState,
  ...savedStateData,
  settings: {
    ...initialState.settings,
    ...savedStateData.settings,
  },
})
const activeTab = ref('calendar')
const isBookMenuOpen = ref(false)
const currentMonth = ref(`${today.getFullYear()}-${pad(today.getMonth() + 1)}`)
const selectedDate = ref(toDateKey(today))

const transactionForm = reactive({
  type: 'expense',
  title: '',
  category: '식비',
  amount: '',
})

const assetForm = reactive({
  name: '',
  type: '은행',
  balance: '',
})

watch(
  state,
  () => {
    localStorage.setItem('moneybook-state', JSON.stringify(state))
  },
  { deep: true },
)

const tabs = [
  { id: 'calendar', label: '달력' },
  { id: 'analytics', label: '분석' },
  { id: 'assets', label: '자산' },
  { id: 'settings', label: '설정' },
]

const activeTabIndex = computed(() => tabs.findIndex((tab) => tab.id === activeTab.value))

const monthTransactions = computed(() =>
  state.transactions.filter((item) => item.date.startsWith(currentMonth.value)),
)

const selectedTransactions = computed(() =>
  state.transactions
    .filter((item) => item.date === selectedDate.value)
    .sort((a, b) => b.id - a.id),
)

const monthIncome = computed(() =>
  monthTransactions.value
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + Number(item.amount), 0),
)

const monthExpense = computed(() =>
  monthTransactions.value
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount), 0),
)

const monthBalance = computed(() => monthIncome.value - monthExpense.value)
const budgetLeft = computed(() => state.settings.monthlyBudget - monthExpense.value)

const calendarDays = computed(() => {
  const [year, month] = currentMonth.value.split('-').map(Number)
  const firstDay = new Date(year, month - 1, 1)
  const lastDate = new Date(year, month, 0).getDate()
  const prefix = firstDay.getDay()
  const days = Array.from({ length: prefix }, () => null)

  for (let day = 1; day <= lastDate; day += 1) {
    const date = `${year}-${pad(month)}-${pad(day)}`
    const dailyItems = state.transactions.filter((item) => item.date === date)
    const income = dailyItems
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + Number(item.amount), 0)
    const expense = dailyItems
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + Number(item.amount), 0)

    days.push({ day, date, income, expense })
  }

  return days
})

const categorySummary = computed(() => {
  const totals = monthTransactions.value
    .filter((item) => item.type === 'expense')
    .reduce((result, item) => {
      result[item.category] = (result[item.category] || 0) + Number(item.amount)
      return result
    }, {})

  return Object.entries(totals)
    .map(([category, amount]) => ({
      category,
      amount,
      percent: monthExpense.value ? Math.round((amount / monthExpense.value) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
})

const monthlyTrend = computed(() => {
  const base = new Date(`${currentMonth.value}-01`)
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(base.getFullYear(), base.getMonth() - 5 + index, 1)
    const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
    const items = state.transactions.filter((item) => item.date.startsWith(key))
    return {
      label: `${date.getMonth() + 1}월`,
      income: items
        .filter((item) => item.type === 'income')
        .reduce((sum, item) => sum + Number(item.amount), 0),
      expense: items
        .filter((item) => item.type === 'expense')
        .reduce((sum, item) => sum + Number(item.amount), 0),
    }
  })
})

const trendMax = computed(() =>
  Math.max(1, ...monthlyTrend.value.flatMap((item) => [item.income, item.expense])),
)

const totalAssets = computed(() =>
  state.assets
    .filter((asset) => Number(asset.balance) > 0)
    .reduce((sum, asset) => sum + Number(asset.balance), 0),
)

const totalDebt = computed(() =>
  Math.abs(
    state.assets
      .filter((asset) => Number(asset.balance) < 0)
      .reduce((sum, asset) => sum + Number(asset.balance), 0),
  ),
)

const netWorth = computed(() => totalAssets.value - totalDebt.value)

function addTransaction() {
  const amount = Number(transactionForm.amount)
  if (!transactionForm.title.trim() || amount <= 0) return

  state.transactions.push({
    id: Date.now(),
    date: selectedDate.value,
    type: transactionForm.type,
    title: transactionForm.title.trim(),
    category: transactionForm.category,
    amount,
  })

  transactionForm.title = ''
  transactionForm.amount = ''
}

function removeTransaction(id) {
  state.transactions = state.transactions.filter((item) => item.id !== id)
}

function addAsset() {
  if (!assetForm.name.trim() || assetForm.balance === '') return

  state.assets.push({
    id: Date.now(),
    name: assetForm.name.trim(),
    type: assetForm.type,
    balance: Number(assetForm.balance),
  })

  assetForm.name = ''
  assetForm.balance = ''
}

function removeAsset(id) {
  state.assets = state.assets.filter((asset) => asset.id !== id)
}

function updateAssetBalance(id, value) {
  const asset = state.assets.find((item) => item.id === id)
  if (asset) asset.balance = Number(value)
}

function changeMonth(offset) {
  const [year, month] = currentMonth.value.split('-').map(Number)
  const date = new Date(year, month - 1 + offset, 1)
  currentMonth.value = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
  selectedDate.value = toDateKey(date)
}

function selectMonth(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  currentMonth.value = monthKey
  selectedDate.value = toDateKey(date)
}

function addCategory(event) {
  const input = event.target
  const category = input.value.trim()
  if (category && !state.settings.categories.includes(category)) {
    state.settings.categories.push(category)
    input.value = ''
  }
}
</script>

<template>
  <main class="app-shell" :data-theme="state.settings.theme">
    <section class="topbar">
      <div class="title-area">
        <p class="eyebrow">Moneybook</p>
        <div class="title-row">
          <div class="title-copy">
            <h1>{{ state.settings.bookName || '내 가계부' }}</h1>
            <div class="compact-summary" aria-label="이번 달 요약">
              <span>수입 {{ currency.format(monthIncome) }}</span>
              <span>지출 {{ currency.format(monthExpense) }}</span>
              <span>잔액 {{ currency.format(monthBalance) }}</span>
            </div>
          </div>
          <div class="book-menu">
            <button
              class="menu-button"
              type="button"
              aria-label="가계부 설정 열기"
              :aria-expanded="isBookMenuOpen"
              @click="isBookMenuOpen = !isBookMenuOpen"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            <section v-if="isBookMenuOpen" class="book-menu-panel">
              <div class="panel-heading">
                <p>Book</p>
                <h2>가계부 설정</h2>
              </div>
              <label>
                <span>가계부 이름</span>
                <input v-model.trim="state.settings.bookName" type="text" placeholder="내 가계부" />
              </label>
              <label>
                <span>월 예산</span>
                <input v-model.number="state.settings.monthlyBudget" type="number" min="0" />
              </label>
              <label>
                <span>테마</span>
                <select v-model="state.settings.theme">
                  <option value="light">밝게</option>
                  <option value="dark">어둡게</option>
                </select>
              </label>
              <label>
                <span>카테고리 추가</span>
                <input type="text" placeholder="새 카테고리" @keyup.enter="addCategory" />
              </label>
            </section>
          </div>
        </div>
      </div>
    </section>

    <DateView
      v-if="activeTab === 'calendar'"
      :calendar-days="calendarDays"
      :categories="state.settings.categories"
      :current-month="currentMonth"
      :currency="currency"
      :selected-date="selectedDate"
      :selected-transactions="selectedTransactions"
      :transaction-form="transactionForm"
      @add-transaction="addTransaction"
      @change-month="changeMonth"
      @remove-transaction="removeTransaction"
      @select-date="selectedDate = $event"
      @select-month="selectMonth"
    />

    <AnalysisView
      v-if="activeTab === 'analytics'"
      :budget-left="budgetLeft"
      :category-summary="categorySummary"
      :currency="currency"
      :current-month="currentMonth"
      :monthly-trend="monthlyTrend"
      :trend-max="trendMax"
    />

    <AssetView
      v-if="activeTab === 'assets'"
      :asset-form="assetForm"
      :assets="state.assets"
      :currency="currency"
      :net-worth="netWorth"
      :total-assets="totalAssets"
      :total-debt="totalDebt"
      @add-asset="addAsset"
      @remove-asset="removeAsset"
      @update-asset-balance="updateAssetBalance"
    />

    <SettingView
      v-if="activeTab === 'settings'"
      :categories="state.settings.categories"
      :settings="state.settings"
      @add-category="addCategory"
    />

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
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>
  </main>
</template>
