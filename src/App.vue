<script setup>
import { computed, reactive, ref, watch } from 'vue'
import AppHeader from './components/AppHeader.vue'
import Nav from './components/Nav.vue'
import { pad, toDateKey, useCalendar } from './composables/useCalendar'
import { useCategories } from './composables/useCategories'
import { useAnalysis } from './composables/useAnalysis'
import { useTransactions } from './composables/useTransactions'
import AnalysisView from './views/Analysis/Analysis.vue'
import AssetView from './views/Asset/Asset.vue'
import DatePage from './views/Date/DatePage.vue'
import SettingView from './views/Setting/Setting.vue'

const today = new Date()
const currency = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
})

const defaultCategoryDetails = {
  식비: { type: 'expense', icon: '', subcategories: ['외식', '장보기', '간식'] },
  교통: { type: 'expense', icon: '', subcategories: ['버스', '지하철', '택시'] },
  주거: { type: 'expense', icon: '', subcategories: ['월세', '관리비', '수리'] },
  쇼핑: { type: 'expense', icon: '', subcategories: ['의류', '생활용품', '선물'] },
  월급: { type: 'income', icon: '', subcategories: ['기본급', '상여', '수당'] },
  이체: { type: 'transfer', icon: '', subcategories: ['계좌이체', '저축', '현금이동'] },
  기타: { type: 'expense', icon: '', subcategories: ['취미', '구독', '기타'] },
}

const initialState = {
  transactions: [
    {
      id: 1,
      date: toDateKey(today),
      type: 'expense',
      category: '식비',
      subcategory: '외식',
      title: '외식',
      amount: 12000,
    },
    {
      id: 2,
      date: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-05`,
      type: 'income',
      category: '월급',
      subcategory: '기본급',
      title: '기본급',
      amount: 2800000,
    },
    {
      id: 3,
      date: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-09`,
      type: 'expense',
      category: '교통',
      subcategory: '버스',
      title: '버스',
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
    categories: ['식비', '교통', '주거', '쇼핑', '월급', '이체', '기타'],
    categoryDetails: defaultCategoryDetails,
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
    categoryDetails: {
      ...initialState.settings.categoryDetails,
      ...savedStateData.settings?.categoryDetails,
    },
  },
})

Object.entries(defaultCategoryDetails).forEach(([category, details]) => {
  if (!state.settings.categories.includes(category)) {
    state.settings.categories.push(category)
  }
  state.settings.categoryDetails[category] = {
    ...details,
    ...state.settings.categoryDetails[category],
  }
})

const activeTab = ref('calendar')
const { calendarDays, changeMonth, currentMonth, selectMonth, selectedDate } = useCalendar(state, today)
const {
  addTransaction,
  budgetLeft,
  monthBalance,
  monthExpense,
  monthIncome,
  monthTransactions,
  removeTransaction,
  selectedTransactions,
  transactionForm,
  updateTransaction,
} = useTransactions(state, selectedDate, currentMonth)

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
const {
  activeBookPage,
  addCategory,
  categoryPageMode,
  closeBookPage,
  deleteCategory,
  isBookMenuOpen,
  openCategoryPicker,
  selectTransactionCategory,
  toggleBookPage,
  updateCategory,
  updateCategoryDetails,
} = useCategories(state, transactionForm)

function selectTab(tabId) {
  activeTab.value = tabId
  closeBookPage()
}

const { categorySummary, monthlyTrend, trendMax } = useAnalysis(
  state,
  currentMonth,
  monthTransactions,
  monthExpense,
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
</script>

<template>
  <main class="app-shell" :class="{ 'book-menu-open': isBookMenuOpen }" :data-theme="state.settings.theme">
    <AppHeader
      v-if="!isBookMenuOpen"
      :active-book-page="activeBookPage"
      :active-tab="activeTab"
      :balance="monthBalance"
      :book-name="state.settings.bookName"
      :currency="currency"
      :expense="monthExpense"
      :income="monthIncome"
      @open-category="toggleBookPage('category')"
      @open-settings="toggleBookPage('settings')"
    />

    <DatePage
      v-if="activeTab === 'calendar'"
      :active-book-page="activeBookPage"
      :calendar-days="calendarDays"
      :categories="state.settings.categories"
      :category-details="state.settings.categoryDetails"
      :category-page-mode="categoryPageMode"
      :currency="currency"
      :current-month="currentMonth"
      :selected-date="selectedDate"
      :selected-transactions="selectedTransactions"
      :settings="state.settings"
      :transaction-form="transactionForm"
      :week-starts-on="state.settings.weekStartsOn"
      @add-category="addCategory"
      @add-transaction="addTransaction"
      @change-month="changeMonth"
      @close-page="closeBookPage"
      @delete-category="deleteCategory"
      @open-category-page="openCategoryPicker"
      @remove-transaction="removeTransaction"
      @select-date="selectedDate = $event"
      @select-month="selectMonth"
      @select-subcategory="selectTransactionCategory"
      @update-category-details="updateCategoryDetails"
      @update-category="updateCategory"
      @update-transaction="updateTransaction"
    />

    <AnalysisView
      v-if="activeTab === 'analytics' && !isBookMenuOpen"
      :budget-left="budgetLeft"
      :category-summary="categorySummary"
      :currency="currency"
      :current-month="currentMonth"
      :monthly-trend="monthlyTrend"
      :trend-max="trendMax"
    />

    <AssetView
      v-if="activeTab === 'assets' && !isBookMenuOpen"
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
      v-if="activeTab === 'settings' && !isBookMenuOpen"
      :categories="state.settings.categories"
      :settings="state.settings"
      @add-category="addCategory"
    />

    <Nav
      v-if="!isBookMenuOpen"
      :active-tab="activeTab"
      :active-tab-index="activeTabIndex"
      :tabs="tabs"
      @select-tab="selectTab"
    />
  </main>
</template>
