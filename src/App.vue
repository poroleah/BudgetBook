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

const defaultAssetTypes = ['은행', '현금', '저축', '투자', '대출']

const initialState = {
  id: 'book-default',
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
    { id: 3, name: '이번 달 카드값', type: '대출', balance: -320000 },
  ],
  settings: {
    bookName: '내 가계부',
    assetTypes: defaultAssetTypes,
    carryOverIncome: false,
    monthlyBudget: 1200000,
    paymentMethods: ['체크카드', '신용카드', '현금', '계좌이체', '기타'],
    theme: 'light',
    weekStartsOn: 'sunday',
    categories: ['식비', '교통', '주거', '쇼핑', '월급', '이체', '기타'],
    categoryDetails: defaultCategoryDetails,
  },
}

const savedState = localStorage.getItem('moneybook-state')
const savedStateData = savedState ? JSON.parse(savedState) : {}

function createBook(id = `book-${Date.now()}`, bookName = '새 가계부') {
  return {
    ...structuredClone(initialState),
    id,
    transactions: [],
    assets: [],
    settings: {
      ...structuredClone(initialState.settings),
      bookName,
      monthlyBudget: 0,
    },
  }
}

function normalizeBook(book) {
  const normalized = {
    ...structuredClone(initialState),
    ...book,
    id: book.id || `book-${Date.now()}`,
    transactions: Array.isArray(book.transactions) ? book.transactions : [],
    assets: Array.isArray(book.assets) ? book.assets : [],
    settings: {
      ...structuredClone(initialState.settings),
      ...book.settings,
      categoryDetails: {
        ...structuredClone(initialState.settings.categoryDetails),
        ...book.settings?.categoryDetails,
      },
    },
  }

  Object.entries(defaultCategoryDetails).forEach(([category, details]) => {
    if (!normalized.settings.categories.includes(category)) {
      normalized.settings.categories.push(category)
    }
    normalized.settings.categoryDetails[category] = {
      ...details,
      ...normalized.settings.categoryDetails[category],
    }
  })

  normalized.assets.forEach((asset) => {
    if (asset.type === '체크카드') {
      asset.type = '은행'
    }
    if (asset.type === '카드' || asset.type === '신용카드') {
      asset.type = '대출'
    }
  })

  if (!Array.isArray(normalized.settings.assetTypes) || !normalized.settings.assetTypes.length) {
    normalized.settings.assetTypes = [...defaultAssetTypes]
  }

  normalized.assets.forEach((asset) => {
    if (asset.type && !normalized.settings.assetTypes.includes(asset.type)) {
      normalized.settings.assetTypes.push(asset.type)
    }
  })

  if (!Array.isArray(normalized.settings.paymentMethods) || !normalized.settings.paymentMethods.length) {
    normalized.settings.paymentMethods = [...initialState.settings.paymentMethods]
  }

  if (normalized.settings.paymentMethods.includes('카드')) {
    normalized.settings.paymentMethods = normalized.settings.paymentMethods.flatMap((method) =>
      method === '카드' ? ['체크카드', '신용카드'] : method,
    )
  }

  normalized.settings.paymentMethods = [...new Set(normalized.settings.paymentMethods)]

  return normalized
}

const savedBooks = Array.isArray(savedStateData.books)
  ? savedStateData.books
  : [savedState ? { ...savedStateData, id: savedStateData.id || 'book-default' } : initialState]

const state = reactive({
  activeBookId: savedStateData.activeBookId || savedBooks[0]?.id || 'book-default',
  books: savedBooks.map((book) => normalizeBook(book)),
})

const activeBook = computed(() => state.books.find((book) => book.id === state.activeBookId) || state.books[0])
const bookState = reactive({
  get transactions() {
    return activeBook.value.transactions
  },
  set transactions(value) {
    activeBook.value.transactions = value
  },
  get assets() {
    return activeBook.value.assets
  },
  set assets(value) {
    activeBook.value.assets = value
  },
  get settings() {
    return activeBook.value.settings
  },
  set settings(value) {
    activeBook.value.settings = value
  },
})

const activeTab = ref('calendar')
const { calendarDays, changeMonth, currentMonth, selectMonth, selectedDate } = useCalendar(bookState, today)
const {
  addTransaction,
  budgetLeft,
  monthBalance,
  monthExpense,
  monthIncome,
  monthTransactions,
  monthTransfer,
  removeTransaction,
  selectedTransactions,
  transactionForm,
  updateTransaction,
} = useTransactions(bookState, selectedDate, currentMonth)

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
} = useCategories(bookState, transactionForm)

function selectTab(tabId) {
  activeTab.value = tabId
  closeBookPage()
}

const { categorySummary, monthlyTrend, trendMax } = useAnalysis(
  bookState,
  currentMonth,
  monthTransactions,
  monthExpense,
)

const totalAssets = computed(() =>
  bookState.assets
    .filter((asset) => Number(asset.balance) > 0)
    .reduce((sum, asset) => sum + Number(asset.balance), 0),
)

const totalDebt = computed(() =>
  Math.abs(
    bookState.assets
      .filter((asset) => Number(asset.balance) < 0)
      .reduce((sum, asset) => sum + Number(asset.balance), 0),
  ),
)

const netWorth = computed(() => totalAssets.value - totalDebt.value)

function addAsset() {
  if (!assetForm.name.trim() || assetForm.balance === '') return

  addAssetToActiveBook({
    name: assetForm.name,
    type: assetForm.type,
    balance: assetForm.balance,
  })

  assetForm.name = ''
  assetForm.balance = ''
}

function addAssetToActiveBook(asset) {
  if (!asset.name?.trim() || asset.balance === '') return
  const assetType = asset.type || bookState.settings.assetTypes[0] || '은행'

  if (!bookState.settings.assetTypes.includes(assetType)) {
    bookState.settings.assetTypes.push(assetType)
  }

  bookState.assets.push({
    id: Date.now(),
    name: asset.name.trim(),
    type: assetType,
    balance: Number(asset.balance),
  })
}

function removeAsset(id) {
  bookState.assets = bookState.assets.filter((asset) => asset.id !== id)
}

function updateAssetBalance(id, value) {
  const asset = bookState.assets.find((item) => item.id === id)
  if (asset) asset.balance = Number(value)
}

function addPaymentMethod(method) {
  const nextMethod = method.trim()
  if (!nextMethod || bookState.settings.paymentMethods.includes(nextMethod)) return
  bookState.settings.paymentMethods.push(nextMethod)
}

function addAssetType(type) {
  const nextType = type.trim()
  if (!nextType || bookState.settings.assetTypes.includes(nextType)) return
  bookState.settings.assetTypes.push(nextType)
}

function syncTransactionFormWithActiveBook() {
  const category = bookState.settings.categories[0] || ''
  transactionForm.category = category
  transactionForm.subcategory = bookState.settings.categoryDetails[category]?.subcategories?.[0] || ''
  transactionForm.assetName = bookState.assets[0]?.name || ''
  transactionForm.paymentMethod = bookState.settings.paymentMethods[0] || ''
  transactionForm.amount = ''
  transactionForm.memo = ''
  transactionForm.date = selectedDate.value
}

function selectBook(bookId) {
  if (state.activeBookId === bookId) return
  state.activeBookId = bookId
  syncTransactionFormWithActiveBook()
  closeBookPage()
}

function addBook() {
  const book = createBook(`book-${Date.now()}`, `새 가계부 ${state.books.length + 1}`)
  state.books.push(normalizeBook(book))
  state.activeBookId = book.id
  syncTransactionFormWithActiveBook()
  closeBookPage()
}

function deleteBook(bookId) {
  if (state.books.length <= 1) return
  const bookIndex = state.books.findIndex((book) => book.id === bookId)
  if (bookIndex === -1) return

  state.books.splice(bookIndex, 1)

  if (state.activeBookId === bookId) {
    state.activeBookId = state.books[Math.max(0, bookIndex - 1)]?.id || state.books[0].id
    syncTransactionFormWithActiveBook()
    closeBookPage()
  }
}
</script>

<template>
  <main class="app-shell" :class="{ 'book-menu-open': isBookMenuOpen }" :data-theme="bookState.settings.theme">
    <AppHeader
      v-if="!isBookMenuOpen"
      :active-book-page="activeBookPage"
      :active-tab="activeTab"
      :active-book-id="state.activeBookId"
      :book-name="bookState.settings.bookName"
      :books="state.books"
      :currency="currency"
      :expense="monthExpense"
      :income="monthIncome"
      :transfer="monthTransfer"
      @add-book="addBook"
      @open-category="toggleBookPage('category')"
      @open-settings="toggleBookPage('settings')"
      @select-book="selectBook"
    />

    <DatePage
      v-if="activeTab === 'calendar'"
      :active-book-page="activeBookPage"
      :assets="bookState.assets"
      :asset-types="bookState.settings.assetTypes"
      :calendar-days="calendarDays"
      :categories="bookState.settings.categories"
      :category-details="bookState.settings.categoryDetails"
      :category-page-mode="categoryPageMode"
      :currency="currency"
      :current-month="currentMonth"
      :payment-methods="bookState.settings.paymentMethods"
      :selected-date="selectedDate"
      :selected-transactions="selectedTransactions"
      :settings="bookState.settings"
      :transaction-form="transactionForm"
      :week-starts-on="bookState.settings.weekStartsOn"
      @add-asset="addAssetToActiveBook"
      @add-asset-type="addAssetType"
      @add-category="addCategory"
      @add-payment-method="addPaymentMethod"
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
      :assets="bookState.assets"
      :asset-types="bookState.settings.assetTypes"
      :currency="currency"
      :net-worth="netWorth"
      :payment-methods="bookState.settings.paymentMethods"
      :total-assets="totalAssets"
      :total-debt="totalDebt"
      @add-asset="addAsset"
      @remove-asset="removeAsset"
      @update-asset-balance="updateAssetBalance"
    />

    <SettingView
      v-if="activeTab === 'settings' && !isBookMenuOpen"
      :active-book-id="state.activeBookId"
      :books="state.books"
      :categories="bookState.settings.categories"
      :settings="bookState.settings"
      @add-category="addCategory"
      @delete-book="deleteBook"
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
