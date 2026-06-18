<script setup>
import AppHeader from './components/AppHeader.vue'
import Nav from './components/Nav.vue'
import { useCalendar } from './composables/useCalendar'
import { useBooks } from './composables/useBooks'
import { useGeneralAccounts } from './composables/useGeneralAccounts'
import { useNavigation } from './composables/useNavigation'
import { useCategories } from './composables/useCategories'
import { useAssetManagement } from './composables/useAssetManagement'
import { useTransactions } from './composables/useTransactions'
import AssetsView from './views/Assets/Assets.vue'
import GeneralAccountView from './views/Assets/GeneralAccount.vue'
import InvestmentView from './views/Assets/Investment.vue'
import SavingsView from './views/Assets/Savings.vue'
import SpendingAnalysisView from './views/Analysis/SpendingAnalysis.vue'
import DatePage from './views/Date/DatePage.vue'
import SettingView from './views/Setting/Setting.vue'

const today = new Date()
const currency = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
})

const {
  addAsset,
  addAssetType,
  addBook: addBookToState,
  addPaymentMethod,
  bookState,
  selectBook: selectBookInState,
  state,
} = useBooks(today)

const { calendarDays, changeMonth, currentMonth, selectMonth, selectedDate } = useCalendar(bookState, today)
const {
  addTransaction,
  budgetLeft,
  monthExpense,
  monthIncome,
  monthTransactions,
  monthTransfer,
  removeTransaction,
  selectedTransactions,
  transactionForm,
  updateTransaction,
} = useTransactions(bookState, selectedDate, currentMonth)

const {
  addInvestmentAccount,
  addInvestmentTransaction,
  addSavingPayment,
  addSavingsAccount,
  investmentAccounts,
  investmentTotals,
  removeInvestmentAccount,
  removeInvestmentTransaction,
  removeSavingPayment,
  removeSavingsAccount,
  savingsAccounts,
  savingsTotals,
} = useAssetManagement(bookState)


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

const { activeTab, activeTabIndex, assetRoute, navigateAsset, selectTab, tabs } = useNavigation(closeBookPage)

const {
  addGeneralAccount,
  combinedTotalAssets,
  generalAccounts,
  generalAccountsTotal,
  removeGeneralAccount,
  updateGeneralAccount,
} = useGeneralAccounts(bookState, savingsTotals, investmentTotals)

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
  if (!selectBookInState(bookId)) return
  syncTransactionFormWithActiveBook()
  closeBookPage()
}

function addBook() {
  addBookToState()
  syncTransactionFormWithActiveBook()
  closeBookPage()
}

</script>

<template>
  <main
    class="app-shell"
    :class="{ 'book-menu-open': isBookMenuOpen }"
    :data-font-size="bookState.settings.fontSize || 'medium'"
    :data-theme="bookState.settings.theme"
  >
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
      @add-asset="addAsset"
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

    <SpendingAnalysisView
      v-if="activeTab === 'analytics' && !isBookMenuOpen"
      :budget-left="budgetLeft"
      :currency="currency"
      :current-month="currentMonth"
      :month-expense="monthExpense"
      :month-transactions="monthTransactions"
      :state="bookState"
    />

    <AssetsView
      v-if="activeTab === 'assets' && assetRoute === '/assets/analysis' && !isBookMenuOpen"
      :combined-total-assets="combinedTotalAssets"
      :currency="currency"
      :general-accounts-count="generalAccounts.length"
      :general-accounts-total="generalAccountsTotal"
      :investment-totals="investmentTotals"
      :savings-count="savingsAccounts.length"
      :savings-totals="savingsTotals"
      @navigate="navigateAsset"
    />

    <GeneralAccountView
      v-if="activeTab === 'assets' && assetRoute === '/assets/cash' && !isBookMenuOpen"
      :accounts="generalAccounts"
      :currency="currency"
      :total="generalAccountsTotal"
      @add-account="addGeneralAccount"
      @back="navigateAsset('/assets/analysis')"
      @remove-account="removeGeneralAccount"
      @update-account="updateGeneralAccount"
    />

    <SavingsView
      v-if="activeTab === 'assets' && assetRoute === '/assets/savings' && !isBookMenuOpen"
      :accounts="savingsAccounts"
      :currency="currency"
      :totals="savingsTotals"
      @add-account="addSavingsAccount"
      @add-payment="addSavingPayment"
      @back="navigateAsset('/assets/analysis')"
      @remove-account="removeSavingsAccount"
      @remove-payment="removeSavingPayment"
    />

    <InvestmentView
      v-if="activeTab === 'assets' && assetRoute === '/assets/investments' && !isBookMenuOpen"
      :accounts="investmentAccounts"
      :currency="currency"
      :totals="investmentTotals"
      @add-account="addInvestmentAccount"
      @add-transaction="addInvestmentTransaction"
      @back="navigateAsset('/assets/analysis')"
      @remove-account="removeInvestmentAccount"
      @remove-transaction="removeInvestmentTransaction"
    />

    <SettingView
      v-if="activeTab === 'settings' && !isBookMenuOpen"
      :books="state.books"
      :settings="bookState.settings"
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
