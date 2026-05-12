<script setup>
import { computed, reactive, ref, watch } from 'vue'
import AnalysisView from './views/Analysis/Analysis.vue'
import AssetView from './views/Asset/Asset.vue'
import DateCategory from './views/Date/Date_Category.vue'
import DateSetting from './views/Date/Date_Setting.vue'
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
    weekStartsOn: 'sunday',
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
const activeBookPage = ref('')
const currentMonth = ref(`${today.getFullYear()}-${pad(today.getMonth() + 1)}`)
const selectedDate = ref(toDateKey(today))

const transactionForm = reactive({
  type: 'expense',
  amount: '',
  category: '식비',
  date: selectedDate.value,
  memo: '',
  paymentMethod: '카드',
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

watch(selectedDate, (date) => {
  transactionForm.date = date
})

const tabs = [
  { id: 'calendar', label: '달력' },
  { id: 'analytics', label: '분석' },
  { id: 'assets', label: '자산' },
  { id: 'settings', label: '설정' },
]

const activeTabIndex = computed(() => tabs.findIndex((tab) => tab.id === activeTab.value))
const isBookMenuOpen = computed(() => activeBookPage.value !== '')

function selectTab(tabId) {
  activeTab.value = tabId
  activeBookPage.value = ''
}

function toggleBookPage(page) {
  activeBookPage.value = activeBookPage.value === page ? '' : page
}

function closeBookPage() {
  activeBookPage.value = ''
}

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
  const weekStartOffset = state.settings.weekStartsOn === 'monday' ? 1 : 0
  const prefix = (firstDay.getDay() - weekStartOffset + 7) % 7
  const days = Array.from({ length: prefix }, () => null)

  for (let day = 1; day <= lastDate; day += 1) {
    const date = `${year}-${pad(month)}-${pad(day)}`
    const weekday = new Date(year, month - 1, day).getDay()
    const dailyItems = state.transactions.filter((item) => item.date === date)
    const income = dailyItems
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + Number(item.amount), 0)
    const expense = dailyItems
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + Number(item.amount), 0)

    days.push({ day, date, weekday, income, expense })
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
  if (amount <= 0) return

  state.transactions.push({
    id: Date.now(),
    date: transactionForm.date || selectedDate.value,
    type: transactionForm.type,
    title: transactionForm.memo.trim() || transactionForm.category,
    category: transactionForm.category,
    amount,
    memo: transactionForm.memo.trim(),
    paymentMethod: transactionForm.paymentMethod,
  })

  transactionForm.amount = ''
  transactionForm.memo = ''
  transactionForm.date = selectedDate.value
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
  const input = typeof event === 'string' ? null : event.target
  const category = (typeof event === 'string' ? event : input.value).trim()
  if (category && !state.settings.categories.includes(category)) {
    state.settings.categories.push(category)
    if (input) input.value = ''
  }
}

function updateCategory({ oldName, newName }) {
  const nextName = newName.trim()
  if (!oldName || !nextName) return
  const categoryIndex = state.settings.categories.indexOf(oldName)
  if (categoryIndex === -1) return
  if (oldName !== nextName && state.settings.categories.includes(nextName)) return

  state.settings.categories[categoryIndex] = nextName
  state.transactions.forEach((transaction) => {
    if (transaction.category === oldName) {
      transaction.category = nextName
    }
  })
}

function deleteCategory(category) {
  state.settings.categories = state.settings.categories.filter((item) => item !== category)
}
</script>

<template>
  <main class="app-shell" :class="{ 'book-menu-open': isBookMenuOpen }" :data-theme="state.settings.theme">
    <section class="topbar">
      <div class="title-area">
        <p class="eyebrow">Moneybook</p>
        <div class="title-row">
          <div class="title-copy">
            <div class="title-heading">
              <h1>{{ state.settings.bookName || '내 가계부' }}</h1>
            </div>
            <div class="compact-summary" aria-label="이번 달 요약">
              <span>수입 {{ currency.format(monthIncome) }}</span>
              <span>지출 {{ currency.format(monthExpense) }}</span>
              <span>잔액 {{ currency.format(monthBalance) }}</span>
            </div>
          </div>
          <div v-if="activeTab === 'calendar'" class="book-menu">
            <button
              class="menu-button category-menu-button"
              type="button"
              aria-label="카테고리 페이지 열기"
              :aria-expanded="activeBookPage === 'category'"
              @click="toggleBookPage('category')"
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
              @click="toggleBookPage('settings')"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <section
      v-if="activeTab === 'calendar'"
      class="calendar-page-shell"
      :class="{ 'settings-page-open': isBookMenuOpen }"
    >
      <DateView
        :calendar-days="calendarDays"
        :categories="state.settings.categories"
        :current-month="currentMonth"
        :currency="currency"
        :selected-date="selectedDate"
        :selected-transactions="selectedTransactions"
        :transaction-form="transactionForm"
        :week-starts-on="state.settings.weekStartsOn"
        @add-transaction="addTransaction"
        @change-month="changeMonth"
        @open-category-page="toggleBookPage('category')"
        @remove-transaction="removeTransaction"
        @select-date="selectedDate = $event"
        @select-month="selectMonth"
      />

      <Transition name="calendar-settings-backdrop">
        <button
          v-if="isBookMenuOpen"
          class="calendar-settings-backdrop"
          type="button"
          aria-label="카테고리 또는 설정 페이지 닫기"
          @click="closeBookPage"
        ></button>
      </Transition>

      <Transition name="calendar-settings-drawer">
        <DateCategory
          v-if="activeBookPage === 'category'"
          key="calendar-category"
          class="calendar-settings-page"
          :categories="state.settings.categories"
          @add-category="addCategory"
          @delete-category="deleteCategory"
          @update-category="updateCategory"
        />

        <DateSetting
          v-else-if="activeBookPage === 'settings'"
          key="calendar-settings"
          class="calendar-settings-page"
          :settings="state.settings"
          @add-category="addCategory"
        />
      </Transition>
    </section>

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
        @click="selectTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </nav>
  </main>
</template>
