import { computed, ref } from 'vue'

export function useCategories(state, transactionForm) {
  const activeBookPage = ref('')
  const categoryPageMode = ref('manage')
  const isBookMenuOpen = computed(() => activeBookPage.value !== '')

  function toggleBookPage(page) {
    categoryPageMode.value = 'manage'
    activeBookPage.value = activeBookPage.value === page ? '' : page
  }

  function closeBookPage() {
    activeBookPage.value = ''
    categoryPageMode.value = 'manage'
  }

  function openCategoryPicker() {
    activeBookPage.value = 'category'
    categoryPageMode.value = 'select'
  }

  function selectTransactionCategory({ category, subcategory }) {
    transactionForm.category = category
    transactionForm.subcategory = subcategory
    transactionForm.type = state.settings.categoryDetails[category]?.type || transactionForm.type
    closeBookPage()
  }

  function addCategory(event) {
    const input = typeof event === 'string' ? null : event.target
    const category = (typeof event === 'string' ? event : input.value).trim()
    if (category && !state.settings.categories.includes(category)) {
      state.settings.categories.push(category)
      state.settings.categoryDetails[category] = {
        type: 'expense',
        icon: '',
        subcategories: ['기본'],
      }
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
    if (state.settings.categoryDetails[oldName]) {
      state.settings.categoryDetails[nextName] = state.settings.categoryDetails[oldName]
      delete state.settings.categoryDetails[oldName]
    }
    state.transactions.forEach((transaction) => {
      if (transaction.category === oldName) {
        transaction.category = nextName
      }
    })
  }

  function deleteCategory(category) {
    state.settings.categories = state.settings.categories.filter((item) => item !== category)
    delete state.settings.categoryDetails[category]
  }

  function updateCategoryDetails({ category, details }) {
    state.settings.categoryDetails[category] = details
  }

  return {
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
  }
}
