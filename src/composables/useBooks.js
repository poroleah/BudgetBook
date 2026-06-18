import { computed, reactive, watch } from 'vue'
import { createBook, createInitialBook } from '../data/defaultBook'
import { normalizeBook } from '../utils/bookMigration'

export function useBooks(today = new Date()) {
  const initialState = createInitialBook(today)
  const savedState = localStorage.getItem('moneybook-state')
  const savedStateData = savedState ? JSON.parse(savedState) : {}
  const savedBooks = Array.isArray(savedStateData.books)
    ? savedStateData.books
    : [savedState ? { ...savedStateData, id: savedStateData.id || 'book-default' } : initialState]

  const state = reactive({
    activeBookId: savedStateData.activeBookId || savedBooks[0]?.id || 'book-default',
    books: savedBooks.map((book) => normalizeBook(book, initialState, today)),
  })
  const activeBook = computed(() =>
    state.books.find((book) => book.id === state.activeBookId) || state.books[0],
  )
  const bookState = reactive({
    get transactions() { return activeBook.value.transactions },
    set transactions(value) { activeBook.value.transactions = value },
    get assets() { return activeBook.value.assets },
    set assets(value) { activeBook.value.assets = value },
    get savingsAccounts() { return activeBook.value.savingsAccounts },
    set savingsAccounts(value) { activeBook.value.savingsAccounts = value },
    get savingPayments() { return activeBook.value.savingPayments },
    set savingPayments(value) { activeBook.value.savingPayments = value },
    get investmentAccounts() { return activeBook.value.investmentAccounts },
    set investmentAccounts(value) { activeBook.value.investmentAccounts = value },
    get investmentTransactions() { return activeBook.value.investmentTransactions },
    set investmentTransactions(value) { activeBook.value.investmentTransactions = value },
    get settings() { return activeBook.value.settings },
    set settings(value) { activeBook.value.settings = value },
  })

  watch(state, () => {
    localStorage.setItem('moneybook-state', JSON.stringify(state))
  }, { deep: true, immediate: true })

  function selectBook(bookId) {
    if (state.activeBookId === bookId) return false
    state.activeBookId = bookId
    return true
  }

  function addBook() {
    const book = createBook(initialState, 'book-' + Date.now(), '새 가계부 ' + (state.books.length + 1))
    state.books.push(normalizeBook(book, initialState, today))
    state.activeBookId = book.id
    return book
  }

  function addAsset(asset) {
    if (!asset.name?.trim() || asset.balance === '') return
    const assetType = asset.type || bookState.settings.assetTypes[0] || '은행'
    if (!bookState.settings.assetTypes.includes(assetType)) bookState.settings.assetTypes.push(assetType)
    bookState.assets.push({
      id: Date.now(),
      name: asset.name.trim(),
      type: assetType,
      balance: Number(asset.balance),
    })
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

  return { addAsset, addAssetType, addBook, addPaymentMethod, bookState, selectBook, state }
}
